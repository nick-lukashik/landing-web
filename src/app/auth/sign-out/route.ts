import { type NextRequest, NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env/server'
import { off } from '@/lib/sso/respond'
import { cookieNames, endSession, expiredCookie, openSession, sso } from '@/lib/sso/sso'

export const dynamic = 'force-dynamic'

/**
 * "Sign out" (a POST from the header's form) signs out of the whole account
 * in this browser: this site's session ends at id-api and its cookie goes,
 * then the browser goes to id-web's /logout, which ends the session there
 * and every site's session signed in from it, and comes back to the main page.
 */
export async function POST(request: NextRequest) {
    if (!sso) return off()
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(serverEnv.SITE_URL).origin)
        return new NextResponse(null, {
            status: 403,
        })
    const name = cookieNames().session
    await endSession(sso, openSession(sso, request.cookies.get(name)?.value))
    const target = new URL('/logout', sso.idUrl)
    target.searchParams.set('return', `${serverEnv.SITE_URL}/`)
    const response = NextResponse.redirect(target, 303)
    response.headers.set('cache-control', 'private, no-store')
    response.cookies.set(name, '', expiredCookie())
    return response
}
