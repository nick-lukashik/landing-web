import 'server-only'
import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env/server'
import { SILENT_COOKIE, SILENT_SECONDS, type SilentMark } from './silent'
import { https } from './sso'

/** A redirect to a path of this site (303: the next request is a GET). Never stored by a cache. */
export function to(path: string) {
    const response = NextResponse.redirect(new URL(path, serverEnv.SITE_URL), 303)
    response.headers.set('cache-control', 'private, no-store')
    return response
}

/** What the /auth routes answer while the site has no accounts. */
export function off() {
    return new NextResponse(null, {
        status: 404,
        headers: {
            'cache-control': 'private, no-store',
        },
    })
}

export function markSilent(response: NextResponse, mark: SilentMark, maxAge = SILENT_SECONDS[mark]) {
    response.cookies.set(SILENT_COOKIE, mark, {
        httpOnly: true,
        secure: https(),
        sameSite: 'lax',
        path: '/',
        maxAge,
    })
}
