// The account site for the sign-in tests, in memory: id-web's /authorize and
// the id-api calls this site makes (oauth/token, me, me/session, sessions/refresh
// and logout), none of their rules beyond what the tests need. "Signed in at
// id-web" is the `id_session` cookie the test sets for this host: an email,
// or `deny` for a person who cancels. /logout drops it and the hint. Emails starting with `short-` get 30 s
// tokens (under the site's 60 s refresh margin), emails starting with `down-` a 503 from
// me/session (Redis down at id-api). /test/* lets a test look.
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT ?? 3290)
const codes = new Map() // code -> { email, challenge, redirectUri }
const sessions = new Map() // sessionId -> { email, refreshToken, revoked, checks }
const tokens = new Map() // accessToken -> sessionId
const calls = {
    refresh: 0,
}

function issue(sessionId) {
    const session = sessions.get(sessionId)
    const accessToken = `at.${randomUUID()}`
    session.refreshToken = `${sessionId}.${randomBytes(24).toString('base64url')}`
    tokens.set(accessToken, sessionId)
    return {
        accessToken,
        accessExpiresAt: new Date(Date.now() + (session.email.startsWith('short-') ? 30_000 : 300_000)).toISOString(),
        refreshToken: session.refreshToken,
        sessionId,
    }
}

const json = (response, status, body) => {
    response.writeHead(status, {
        'content-type': 'application/json',
    })
    response.end(body === undefined ? undefined : JSON.stringify(body))
}

createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const text = Buffer.concat(chunks).toString()
    const body = text ? JSON.parse(text) : {}
    const url = new URL(request.url ?? '/', `http://127.0.0.1:${PORT}`)
    const cookie = /(?:^|;\s*)id_session=([^;]+)/.exec(request.headers.cookie ?? '')?.[1]
    const who = cookie ? decodeURIComponent(cookie) : undefined

    if (url.pathname === '/health')
        return json(response, 200, {
            status: 'ok',
        })
    // id-web's /logout: ends "the session at id-web" (the cookie and the hint) and goes back.
    if (url.pathname === '/logout') {
        const back = url.searchParams.get('return') ?? ''
        response.writeHead(303, {
            location: back.startsWith('http://127.0.0.1:') ? back : '/',
            'set-cookie': [
                'id_session=; Max-Age=0; Path=/',
                'nl_hint=; Max-Age=0; Path=/',
            ],
        })
        return response.end()
    }
    if (url.pathname === '/authorize') {
        const q = url.searchParams
        const back = new URL(q.get('redirect_uri') ?? '')
        if (who === 'deny') back.searchParams.set('error', 'access_denied')
        else if (!who) back.searchParams.set('error', 'login_required')
        else {
            const code = randomBytes(32).toString('base64url')
            codes.set(code, {
                email: who,
                challenge: q.get('code_challenge'),
                redirectUri: q.get('redirect_uri'),
            })
            back.searchParams.set('code', code)
        }
        back.searchParams.set('state', q.get('state') ?? '')
        response.writeHead(302, {
            location: back.toString(),
            // As id-web: signed in there means the hint on the parent domain.
            ...(who && who !== 'deny'
                ? {
                      'set-cookie': 'nl_hint=1; Path=/; HttpOnly; SameSite=Lax',
                  }
                : {}),
        })
        return response.end()
    }
    if (url.pathname === '/api/v1/oauth/token' && request.method === 'POST') {
        const issued = codes.get(body.code)
        codes.delete(body.code)
        const challenge = createHash('sha256').update(String(body.codeVerifier)).digest('base64url')
        if (
            !issued
            || issued.challenge !== challenge
            || issued.redirectUri !== body.redirectUri
            || body.clientId !== 'landing-web'
        )
            return json(response, 422, {
                code: 'UNPROCESSABLE',
                details: [
                    {
                        path: 'code',
                        message: 'invalid_grant',
                    },
                ],
            })
        const sessionId = randomUUID()
        sessions.set(sessionId, {
            email: issued.email,
            revoked: false,
            checks: 0,
        })
        return json(response, 200, issue(sessionId))
    }
    if (url.pathname === '/api/v1/me') {
        const sessionId = tokens.get(request.headers.authorization?.replace(/^Bearer /, ''))
        const session = sessions.get(sessionId)
        if (!session || session.revoked)
            return json(response, 401, {
                code: 'UNAUTHORIZED',
            })
        return json(response, 200, {
            email: session.email,
            displayName: session.email.startsWith('named-') ? 'Named Person' : null,
        })
    }
    // As id-api: the token of an ended session still works here, and the answer tells it ended.
    if (url.pathname === '/api/v1/me/session') {
        const session = sessions.get(tokens.get(request.headers.authorization?.replace(/^Bearer /, '')))
        if (!session)
            return json(response, 401, {
                code: 'UNAUTHORIZED',
            })
        session.checks += 1
        if (session.email.startsWith('down-'))
            return json(response, 503, {
                code: 'UNAVAILABLE',
            })
        return json(response, 200, {
            active: !session.revoked,
        })
    }
    if (url.pathname === '/api/v1/sessions/refresh' && request.method === 'POST') {
        calls.refresh += 1
        const sessionId = String(body.refreshToken).split('.')[0]
        const session = sessions.get(sessionId)
        if (!session || session.revoked || session.refreshToken !== body.refreshToken)
            return json(response, 401, {
                code: 'UNAUTHORIZED',
            })
        return json(response, 200, issue(sessionId))
    }
    if (url.pathname === '/api/v1/sessions/logout' && request.method === 'POST') {
        const session = sessions.get(String(body.refreshToken).split('.')[0])
        if (session) session.revoked = true
        return json(response, 204)
    }
    if (url.pathname === '/test/sessions') {
        const email = url.searchParams.get('email')
        const own = [
            ...sessions.values(),
        ].filter(session => session.email === email)
        return json(response, 200, {
            refresh: calls.refresh,
            live: own.filter(session => !session.revoked).length,
            checks: own.reduce((sum, session) => sum + session.checks, 0),
        })
    }
    if (url.pathname === '/test/revoke' && request.method === 'POST') {
        for (const session of sessions.values()) if (session.email === body.email) session.revoked = true
        return json(response, 204)
    }
    return json(response, 404, {
        code: 'NOT_FOUND',
    })
}).listen(PORT, '127.0.0.1')
