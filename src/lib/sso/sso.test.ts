import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.stubEnv('SITE_URL', 'http://site.test')
vi.stubEnv('ID_URL', 'http://id.test')
vi.stubEnv('ID_API_URL', 'http://id-api.test')
vi.stubEnv('SESSION_SECRET', 'test-session-secret-0123456789abcdef')
const { refreshSession, sso } = await import('./sso')
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
