import { type NextRequest, NextResponse } from 'next/server'
import { markTried, off, to } from '@/lib/sso/respond'
import { HINT_COOKIE, SILENT_COOKIE, safeReturnTo, silentWaits } from '@/lib/sso/silent'
import { beginSignIn, cookieNames, cookieOptions, openSession, PENDING_MAX_AGE, sso } from '@/lib/sso/sso'

export const dynamic = 'force-dynamic'

/**
 * Starts sign-in through id-web, back to `returnTo` (the main page by
 * default). `silent=1` comes from the proxy's silent sign-in: id-web shows no
 * page, and no other attempt follows for a while, whatever this one gives.
 */
export function GET(request: NextRequest) {
    if (!sso) return off()
    // Sign-in leaves this origin, where a fetch cannot follow: a router fetch
    // gets an empty answer and loads the URL as a document instead.
    if ((request.headers.get('sec-fetch-dest') ?? 'document') !== 'document')
        return new NextResponse(null, {
            status: 204,
            headers: {
                'cache-control': 'no-store',
            },
        })
    const params = request.nextUrl.searchParams
    const returnTo = safeReturnTo(params.get('returnTo'))
    const silent = params.get('silent') === '1'
    if (silent && (!request.cookies.has(HINT_COOKIE) || silentWaits(request.cookies.get(SILENT_COOKIE)?.value)))
        return to(returnTo)
    // Signed in here already (a stale link, a second tab): straight back.
    if (openSession(sso, request.cookies.get(cookieNames().session)?.value)) return to(returnTo)

    const { url, cookie } = beginSignIn(sso, returnTo, silent)
    const response = NextResponse.redirect(url, 303)
    response.headers.set('cache-control', 'private, no-store')
    response.cookies.set(cookieNames().pending, cookie, cookieOptions(PENDING_MAX_AGE))
    if (silent) markTried(response)
    return response
}
