// The account site for the sign-in tests, in memory: id-web's /login, which seals
// the session cookie every site shares, and the id-api calls this site makes (me,
// sessions/refresh, sessions/logout). None of their rules beyond what the tests need.
// /login signs in as the email of the `e2e_email` cookie the test sets. Cookies do
// not care about ports, so the one it sets reaches the site as it would across
// subdomains. Emails starting with `short-` get 30 s tokens (under the site's 60 s
// refresh margin), `down-` a 503 from me, `fail-` a 503 from logout, `named-` a
// name. /test/* lets a test look.
import { createCipheriv, createHash, randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT ?? 3290)
const SECRET = process.env.SESSION_SECRET ?? ''
const sessions = new Map() // sessionId -> { email, refreshToken, revoked, me, refreshes }
const tokens = new Map() // accessToken -> sessionId

/** As src/lib/session/seal.ts. */
function seal(value) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(SECRET).digest(), iv)
    cipher.setAAD(Buffer.from('session'))
    const body = Buffer.concat([
        cipher.update(JSON.stringify(value), 'utf8'),
        cipher.final(),
    ])
    return Buffer.concat([
        iv,
        cipher.getAuthTag(),
        body,
    ]).toString('base64url')
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

    if (url.pathname === '/health')
        return json(response, 200, {
            status: 'ok',
        })
    if (url.pathname === '/login') {
        const email = decodeURIComponent(/(?:^|;\s*)e2e_email=([^;]+)/.exec(request.headers.cookie ?? '')?.[1] ?? '')
        const sessionId = randomUUID()
        sessions.set(sessionId, {
            email,
            revoked: false,
            me: 0,
            refreshes: 0,
        })
        const issued = issue(sessionId)
        response.writeHead(303, {
            location: url.searchParams.get('continue') ?? '/',
            'set-cookie': `nl_session=${seal({
                ...issued,
                accessExpiresAt: Date.parse(issued.accessExpiresAt),
            })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
        })
        return response.end()
    }
    // As id-api: the token of an ended session still works here, and the answer tells it ended.
    if (url.pathname === '/api/v1/me') {
        const session = sessions.get(tokens.get(request.headers.authorization?.replace(/^Bearer /, '')))
        if (!session)
            return json(response, 401, {
                code: 'UNAUTHORIZED',
            })
        session.me += 1
        if (session.email.startsWith('down-'))
            return json(response, 503, {
                code: 'UNAVAILABLE',
            })
        return json(response, 200, {
            email: session.email,
            displayName: session.email.startsWith('named-') ? 'Named Person' : null,
            active: !session.revoked,
        })
    }
    if (url.pathname === '/api/v1/sessions/refresh' && request.method === 'POST') {
        const sessionId = String(body.refreshToken).split('.')[0]
        const session = sessions.get(sessionId)
        if (!session || session.revoked || session.refreshToken !== body.refreshToken)
            return json(response, 401, {
                code: 'UNAUTHORIZED',
            })
        session.refreshes += 1
        return json(response, 200, issue(sessionId))
    }
    if (url.pathname === '/api/v1/sessions/logout' && request.method === 'POST') {
        const session = sessions.get(String(body.refreshToken).split('.')[0])
        if (session?.email.startsWith('fail-'))
            return json(response, 503, {
                code: 'UNAVAILABLE',
            })
        if (session) session.revoked = true
        return json(response, 204)
    }
    if (url.pathname === '/test/sessions') {
        const own = [
            ...sessions.values(),
        ].filter(session => session.email === url.searchParams.get('email'))
        return json(response, 200, {
            live: own.filter(session => !session.revoked).length,
            me: own.reduce((sum, session) => sum + session.me, 0),
            refreshes: own.reduce((sum, session) => sum + session.refreshes, 0),
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
