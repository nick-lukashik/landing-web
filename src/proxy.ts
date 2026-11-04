import { type NextRequest, NextResponse } from 'next/server'
import { LOCALE_COOKIE, LOCALE_HEADER, LOCALE_PARAM, localeCookieOptions } from '@/i18n/config'
import { resolveLocale } from '@/i18n/resolve'
import { REQUEST_ID_HEADER, requestIdFrom } from '@/lib/request-id'
import { buildCsp, createNonce, NONCE_HEADER } from '@/lib/security/csp'
import { CANONICAL_HEADER, canonicalPath, PATHNAME_HEADER } from '@/lib/seo/alternates'

// Read at runtime: the same image reports what the deploy sets.
const version = process.env.APP_VERSION || 'dev'

/** Probes: no CSP, no locale. */
const isMachinePath = (path: string) => path.startsWith('/health/')

/**
 * Every request but /api: a request id (kept from the edge or new) and the app
 * version. Pages also get a per-request CSP nonce, the resolved locale
 * (?lang= > cookie > Accept-Language) and their path for metadata.
 */
export function proxy(request: NextRequest) {
    const requestId = requestIdFrom(request.headers.get(REQUEST_ID_HEADER))
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
    if (csp) response.headers.set('content-security-policy', csp)
    if (persistLocale) {
        response.cookies.set(LOCALE_COOKIE, persistLocale, localeCookieOptions(https))
    }
    return response
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
