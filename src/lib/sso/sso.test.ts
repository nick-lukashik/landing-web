import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.stubEnv('SITE_URL', 'http://site.test')
vi.stubEnv('ID_URL', 'http://id.test')
vi.stubEnv('ID_API_URL', 'http://id-api.test')
vi.stubEnv('SESSION_SECRET', 'test-session-secret-0123456789abcdef')
const { refreshSession, sessionActive, sso } = await import('./sso')
vi.unstubAllEnvs()
if (!sso) throw new Error('sso is off')
const config = sso

const session = {
    accessToken: 'at.old',
    accessExpiresAt: Date.parse('2026-11-04T10:00:00Z'),
    refreshToken: 'sid.old',
    sessionId: 'sid',
    account: {
        name: 'Old Name',
        email: 'old@example.com',
    },
}

const tokens = {
    accessToken: 'at.new',
    accessExpiresAt: '2026-11-04T10:05:00Z',
    refreshToken: 'sid.new',
    sessionId: 'sid',
}

/** id-api: the refresh answers with new tokens, /me with `me` (a status for a failure). */
function idApi(me: Record<string, unknown> | number) {
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init?: RequestInit) => {
            const path = new URL(url).pathname
            if (path === '/api/v1/sessions/refresh') return Response.json(tokens)
            if (
                path === '/api/v1/me'
                && new Headers(init?.headers).get('authorization') === `Bearer ${tokens.accessToken}`
            )
                return typeof me === 'number'
                    ? new Response(null, {
                          status: me,
                      })
                    : Response.json(me)
            return new Response(null, {
                status: 404,
            })
        }),
    )
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('refreshSession', () => {
    it('takes the name and email the account has now', async () => {
        idApi({
            id: 'user',
            email: 'new@example.com',
            displayName: 'New Name',
        })
        expect(await refreshSession(config, session)).toEqual({
            accessToken: 'at.new',
            accessExpiresAt: Date.parse(tokens.accessExpiresAt),
            refreshToken: 'sid.new',
            sessionId: 'sid',
            account: {
                name: 'New Name',
                email: 'new@example.com',
            },
        })
    })

    it('keeps the account it had when id-api cannot say who it is', async () => {
        idApi(503)
        expect(await refreshSession(config, session)).toMatchObject({
            accessToken: 'at.new',
            account: session.account,
        })
    })
})

describe('sessionActive', () => {
    /** id-api's answer to the check. */
    const answers = (answer: () => Response) => {
        const fetch = vi.fn(async (_url: string, _init?: RequestInit) => answer())
        vi.stubGlobal('fetch', fetch)
        return fetch
    }

    it('asks with the access token and is true when the session is on', async () => {
        const fetch = answers(() =>
            Response.json({
                active: true,
            }),
        )
        expect(await sessionActive(config, session)).toBe(true)
        const [url, init] = fetch.mock.calls[0] ?? []
        expect(url).toBe('http://id-api.test/api/v1/me/session')
        expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${session.accessToken}`)
    })

    it('is false only when the answer says the session ended', async () => {
        answers(() =>
            Response.json({
                active: false,
            }),
        )
        expect(await sessionActive(config, session)).toBe(false)
    })

    it.for([
        401,
        404,
        500,
        503,
    ])('goes on by the token after a %i', async status => {
        answers(
            () =>
                new Response(null, {
                    status,
                }),
        )
        expect(await sessionActive(config, session)).toBe(true)
    })

    it('goes on by the token when the answer says neither', async () => {
        answers(() => Response.json({}))
        expect(await sessionActive(config, session)).toBe(true)
        answers(() => new Response('<html>'))
        expect(await sessionActive(config, session)).toBe(true)
    })

    it('goes on by the token when id-api cannot be reached', async () => {
        answers(() => {
            throw new TypeError('fetch failed')
        })
        expect(await sessionActive(config, session)).toBe(true)
    })

    it('gives up within a second or so', {
        timeout: 2_000,
    }, async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(
                (_url: string, init?: RequestInit) =>
                    new Promise<Response>((_resolve, reject) => {
                        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
                    }),
            ),
        )
        expect(await sessionActive(config, session)).toBe(true)
    })
})
