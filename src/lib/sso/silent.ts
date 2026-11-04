/**
 * Silent sign-in: a visitor this site has no session for, whose browser is
 * signed in at id-web (the hint cookie on the parent domain), goes through
 * `/auth/sign-in?silent=1` and comes back to the same page, signed in, or
 * signed out when id-web has no session after all. id-web shows no page on
 * the way (`prompt=none`).
 */

/** Set by id-web on the parent domain while its session lives; "1" or nothing. */
export const HINT_COOKIE = 'nl_hint'

/**
 * What this site remembers about silent sign-in in this browser:
 * - `tried`: an attempt was made; none again for a while (no loops);
 * - `out`: the person signed out here, or id-api refused this site's
 *   session: never undone silently, only by signing in here;
 * - `silent`: this site's session came from silent sign-in, so it ends
 *   with the session at id-web (the hint going away).
 */
export const SILENT_COOKIE = 'site_silent'
export type SilentMark = 'tried' | 'out' | 'silent'
export const SILENT_SECONDS: Record<SilentMark, number> = {
    tried: 300,
    out: 365 * 86_400,
    silent: 365 * 86_400,
}
/** The wait after an attempt that would only fail the same way again (a refused request or code). */
export const SILENT_FAILED_SECONDS = 86_400

/** Whether silent sign-in waits: after an attempt or a sign-out, and for any value it does not know. */
export function silentWaits(mark: string | undefined) {
    return mark !== undefined && mark !== 'silent'
}

/** Crawlers and link unfurlers are never sent anywhere, whatever they carry. */
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse/i

/**
 * A person opening a page, as opposed to anything a page or the browser
 * fetches by itself: a GET for a top-level document (Fetch Metadata, or an
 * HTML Accept without it); no prefetch or prerender, frame, script or the
 * router's fetch; no crawler.
 */
export function isPageVisit(
    method: string,
    headers: {
        get(name: string): string | null
    },
) {
    if (method !== 'GET') return false
    const agent = headers.get('user-agent')
    if (!agent || BOT.test(agent)) return false
    if (headers.get('sec-purpose') !== null || headers.get('purpose') !== null) return false
    if (headers.get('rsc') !== null || headers.get('next-router-prefetch') !== null) return false
    const mode = headers.get('sec-fetch-mode')
    const dest = headers.get('sec-fetch-dest')
    if (mode !== null || dest !== null) return mode === 'navigate' && dest === 'document'
    return (headers.get('accept') ?? '').includes('text/html')
}

/** Where silent sign-in never starts: the sign-in round trip itself, the API and the probes. */
const NOT_PAGES = [
    '/auth',
    '/api',
    '/health',
]

/** Whether this request should go through silent sign-in first. */
export function wantsSilentSignIn(input: {
    signedIn: boolean
    hinted: boolean
    mark: string | undefined
    pathname: string
    pageVisit: boolean
}) {
    if (input.signedIn || !input.hinted || silentWaits(input.mark) || !input.pageVisit) return false
    return !NOT_PAGES.some(prefix => input.pathname === prefix || input.pathname.startsWith(`${prefix}/`))
}

/**
 * A path of this site to return to, or the fallback: never `//host` or
 * `/\host`, which browsers read as another site.
 */
export function safeReturnTo(value: unknown, fallback = '/'): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
        return fallback
    try {
        const url = new URL(value, 'http://site.local')
        if (url.origin !== 'http://site.local' || url.pathname.startsWith('/auth/')) return fallback
        return `${url.pathname}${url.search}`
    } catch {
        return fallback
    }
}
