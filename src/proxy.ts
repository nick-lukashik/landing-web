import { type NextRequest, NextResponse } from 'next/server'
import { LOCALE_COOKIE, LOCALE_HEADER, LOCALE_PARAM, localeCookieOptions } from '@/i18n/config'
import { resolveLocale } from '@/i18n/resolve'
import { serverEnv } from '@/lib/env/server'
import { REQUEST_ID_HEADER, requestIdFrom } from '@/lib/request-id'
import { buildCsp, createNonce, NONCE_HEADER } from '@/lib/security/csp'
import { CANONICAL_HEADER, canonicalPath, PATHNAME_HEADER } from '@/lib/seo/alternates'
import { HINT_COOKIE, isPageVisit, SILENT_COOKIE, wantsSilentSignIn } from '@/lib/sso/silent'
import {
    cookieNames,
    cookieOptions,
    endSession,
    expiredCookie,
    openSession,
    REFRESH_BEFORE_MS,
    refreshSession,
    SESSION_MAX_AGE,
    sealSession,
    sso,
} from '@/lib/sso/sso'

// Read at runtime: the same image reports what the deploy sets.
const version = process.env.APP_VERSION || 'dev'

/** Probes: no CSP, no locale. */
const isMachinePath = (path: string) => path.startsWith('/health/')

/**
 * Every request but /api: a request id (kept from the edge or new) and the app
 * version. Pages also get a per-request CSP nonce, the resolved locale
 * (?lang= > cookie > Accept-Language) and their path for metadata. With
 * accounts on, the session is kept fresh before the page renders, and a
 * visitor signed in at id-web is signed in here silently (see lib/sso).
 */
export async function proxy(request: NextRequest) {
    const requestId = requestIdFrom(request.headers.get(REQUEST_ID_HEADER))
    const account = isMachinePath(request.nextUrl.pathname) ? undefined : await keepAccount(request)
    if (account?.redirect) return account.redirect
    const forwarded = new Headers(request.headers)
    forwarded.set(REQUEST_ID_HEADER, requestId)

    const { pathname, searchParams, protocol } = request.nextUrl
    const page = !isMachinePath(pathname)
    const https = request.headers.get('x-forwarded-proto') === 'https' || protocol === 'https:'

    let csp: string | undefined
    let persistLocale: string | undefined
    if (page) {
        const nonce = createNonce()
        csp = buildCsp({
            nonce,
            dev: process.env.NODE_ENV === 'development',
            https,
            analytics: Boolean(serverEnv.GTM_ID),
            // "Sign out" goes on to the account site, which ends its session too.
            formActions: sso
                ? [
                      new URL(sso.idUrl).origin,
                  ]
                : [],
        })
        // Next.js reads the nonce from the request's CSP and puts it on its scripts.
        forwarded.set('content-security-policy', csp)
        forwarded.set(NONCE_HEADER, nonce)

        const locale = resolveLocale({
            query: searchParams.get(LOCALE_PARAM),
            cookie: request.cookies.get(LOCALE_COOKIE)?.value,
            acceptLanguage: request.headers.get('accept-language'),
        })
        forwarded.set(LOCALE_HEADER, locale.locale)
        forwarded.set(PATHNAME_HEADER, pathname)
        forwarded.set(CANONICAL_HEADER, canonicalPath(pathname, locale.locale, locale.source === 'query'))
        if (locale.persist) persistLocale = locale.locale
    }

    const response = NextResponse.next({
        request: {
            headers: forwarded,
        },
    })
    response.headers.set(REQUEST_ID_HEADER, requestId)
    response.headers.set('x-app-version', version)
    account?.apply(response)
    if (csp) response.headers.set('content-security-policy', csp)
    if (persistLocale) {
        response.cookies.set(LOCALE_COOKIE, persistLocale, localeCookieOptions(https))
    }
    return response
}

type AccountStep = {
    /** Silent sign-in: go there before anything renders. */
    redirect?: NextResponse
    apply: (response: NextResponse) => void
}

/**
 * This site's session before the page renders: refreshed when its access
 * token is about to expire (the new cookie goes to the page and the browser),
 * dropped when id-api refuses it, and ended when the hint of id-web is gone
 * (signed out there or on any site: sign-out is for the whole account).
 * Without a session, a hinted page visit goes through silent sign-in.
 */
async function keepAccount(request: NextRequest): Promise<AccountStep | undefined> {
    if (!sso) return undefined
    const name = cookieNames().session
    const hinted = request.cookies.has(HINT_COOKIE)
    const sealed = request.cookies.get(name)?.value
    let session = sealed ? openSession(sso, sealed) : undefined
    const writes: ((response: NextResponse) => void)[] = []
    const drop = () => {
        request.cookies.delete(name)
        session = undefined
        writes.push(response => response.cookies.set(name, '', expiredCookie()))
    }

    if (sealed && !session) drop()
    else if (session && !hinted) {
        await endSession(sso, session)
        drop()
    } else if (session && session.accessExpiresAt - Date.now() < REFRESH_BEFORE_MS) {
        const refreshed = await refreshSession(sso, session)
        if (refreshed === 'ended') drop()
        else if (refreshed !== 'unavailable') {
            const value = sealSession(sso, refreshed)
            request.cookies.set(name, value)
            session = refreshed
            writes.push(response => response.cookies.set(name, value, cookieOptions(SESSION_MAX_AGE)))
        }
    }

    const apply = (response: NextResponse) => {
        for (const write of writes) write(response)
    }
    const { pathname, search } = request.nextUrl
    if (
        wantsSilentSignIn({
            signedIn: Boolean(session),
            hinted,
            mark: request.cookies.get(SILENT_COOKIE)?.value,
            pathname,
            pageVisit: isPageVisit(request.method, request.headers),
        })
    ) {
        const target = new URL('/auth/sign-in', request.nextUrl)
        target.searchParams.set('returnTo', `${pathname}${search}`)
        target.searchParams.set('silent', '1')
        const redirect = NextResponse.redirect(target, 303)
        // It depends on cookies: no shared cache may keep it for anyone else.
        redirect.headers.set('cache-control', 'private, no-store')
        apply(redirect)
        return {
            redirect,
            apply,
        }
    }
    return {
        apply,
    }
}

export const config = {
    // Everything but build assets, the image optimizer and the /api proxy,
    // prefetches included: a prefetched page may be the one shown, so it
    // needs its CSP too. /api is left out because Next.js buffers the body of
    // every request the proxy runs for (up to 10 MB, until it has all of it);
    // the route handler sets the request id and version there itself.
    matcher: [
        '/((?!_next/static/|_next/image|api/).*)',
    ],
}
