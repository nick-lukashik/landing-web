import { type NextRequest } from 'next/server'
import { markTried, off, to } from '@/lib/sso/respond'
import { SILENT_COOKIE, SILENT_FAILED_SECONDS } from '@/lib/sso/silent'
import {
    clientIp,
    cookieNames,
    cookieOptions,
    exchangeCode,
    openPending,
    openSession,
    SESSION_MAX_AGE,
    sameState,
    sealSession,
    sso,
} from '@/lib/sso/sso'

export const dynamic = 'force-dynamic'

/**
 * Back from id-web: the state must match the pending sign-in, then the code
 * becomes this site's own session (server to server) and the browser
 * returns where sign-in started. The pending cookie goes whatever happens.
 *
 * A silent attempt that fails lands on its page signed out, with no error
 * page: the person never asked to sign in. One that would only fail the same
 * way again (a refused request or code, not a missing session or an outage)
 * waits a day before the next one.
 */
export async function GET(request: NextRequest) {
    if (!sso) return off()
    const params = request.nextUrl.searchParams
    const names = cookieNames()
    const pending = openPending(sso, request.cookies.get(names.pending)?.value)
    const done = (response: ReturnType<typeof to>) => {
        response.cookies.delete(names.pending)
        return response
    }

    if (!pending || !sameState(params.get('state'), pending.state)) {
        // Tabs restored together start parallel silent attempts that share one
        // pending cookie, and only the last one matches: the others land quietly.
        const quiet =
            request.cookies.get(SILENT_COOKIE)?.value === 'tried'
            || Boolean(openSession(sso, request.cookies.get(names.session)?.value))
        return quiet ? to('/') : done(to('/auth/error?reason=state'))
    }

    const code = params.get('code')
    const error = params.get('error')
    if (!code) {
        if (pending.silent) {
            const response = done(to(pending.returnTo))
            if (error !== 'login_required' && error !== 'temporarily_unavailable')
                markTried(response, SILENT_FAILED_SECONDS)
            return response
        }
        return done(to(`/auth/error?reason=${error === 'access_denied' ? 'denied' : 'failed'}`))
    }

    const session = await exchangeCode(sso, code, pending.verifier, clientIp(request.headers))
    if (typeof session === 'string') {
        if (pending.silent) {
            const response = done(to(pending.returnTo))
            if (session === 'invalid_grant') markTried(response, SILENT_FAILED_SECONDS)
            return response
        }
        return done(to(`/auth/error?reason=${session === 'unavailable' ? 'unavailable' : 'failed'}`))
    }
    const response = done(to(pending.returnTo))
    response.cookies.set(names.session, sealSession(sso, session), cookieOptions(SESSION_MAX_AGE))
    if (request.cookies.has(SILENT_COOKIE)) response.cookies.delete(SILENT_COOKIE)
    return response
}
