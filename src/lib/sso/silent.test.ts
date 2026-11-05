import { describe, expect, it } from 'vitest'
import { isPageVisit, safeReturnTo, silentWaits, wantsSilentSignIn } from './silent'

const headers = (values: Record<string, string>) => new Headers(values)
const chrome = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140.0 Safari/537.36'

describe('isPageVisit', () => {
    it('is a person opening a page', () => {
        expect(
            isPageVisit(
                'GET',
                headers({
                    'user-agent': chrome,
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-dest': 'document',
                }),
            ),
        ).toBe(true)
    })

    it('is not a prefetch, a router fetch, a crawler or a POST', () => {
        const page = {
            'user-agent': chrome,
            'sec-fetch-mode': 'navigate',
            'sec-fetch-dest': 'document',
        }
        expect(
            isPageVisit(
                'GET',
                headers({
                    ...page,
                    'sec-purpose': 'prefetch',
                }),
            ),
        ).toBe(false)
        // A router fetch: the proxy never sees its `rsc` header, Next.js takes it off first.
        expect(
            isPageVisit(
                'GET',
                headers({
                    ...page,
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-dest': 'empty',
                }),
            ),
        ).toBe(false)
        expect(
            isPageVisit(
                'GET',
                headers({
                    ...page,
                    'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
                }),
            ),
        ).toBe(false)
        expect(
            isPageVisit(
                'GET',
                headers({
                    ...page,
                    'user-agent': `${chrome} Chrome-Lighthouse`,
                }),
            ),
        ).toBe(false)
        expect(isPageVisit('POST', headers(page))).toBe(false)
    })
})

describe('wantsSilentSignIn', () => {
    const visit = {
        signedIn: false,
        hinted: true,
        mark: undefined,
        pathname: '/',
        pageVisit: true,
    }

    it('starts for a hinted visitor without a session here', () => {
        expect(wantsSilentSignIn(visit)).toBe(true)
    })

    it('waits after an attempt, and never on the sign-in routes', () => {
        expect(
            wantsSilentSignIn({
                ...visit,
                mark: 'tried',
            }),
        ).toBe(false)
        expect(
            wantsSilentSignIn({
                ...visit,
                hinted: false,
            }),
        ).toBe(false)
        expect(
            wantsSilentSignIn({
                ...visit,
                pathname: '/auth/callback',
            }),
        ).toBe(false)
        expect(silentWaits('anything')).toBe(true)
    })
})

describe('safeReturnTo', () => {
    it('keeps paths of this site and refuses the rest', () => {
        expect(safeReturnTo('/?lang=ru')).toBe('/?lang=ru')
        for (const value of [
            'https://evil.test/',
            '//evil.test',
            '/\\evil.test',
            '/auth/sign-in',
            undefined,
        ]) {
            expect(safeReturnTo(value)).toBe('/')
        }
    })
})
