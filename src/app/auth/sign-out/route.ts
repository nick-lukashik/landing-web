import { type NextRequest, NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env/server'
import { markSilent, off, to } from '@/lib/sso/respond'
import { cookieNames, endSession, openSession, sso } from '@/lib/sso/sso'

export const dynamic = 'force-dynamic'

/**
 * Sign-out is a POST from the header's form: the session ends at id-api, the
 * cookie goes (even when id-api does not answer). `out` keeps the session at
 * id-web from signing the person back in silently; signing in here again
 * lifts it. id-web's own session stays: sign out there to leave everything.
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
    const response = to('/')
    response.cookies.delete(name)
    markSilent(response, 'out')
    return response
}
