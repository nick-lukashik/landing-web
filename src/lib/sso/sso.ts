import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { serverEnv } from '@/lib/env/server'
import { seal, unseal } from '@/lib/session/seal'
import { safeReturnTo } from './silent'

/**
 * This site as a client of the account site: sign-in goes through id-web
 * (authorization code with PKCE), and the code becomes this site's own
 * session at id-api, server to server. The browser holds one sealed cookie;
 * tokens never reach its JavaScript. Null while the site has no accounts
 * (ID_URL, ID_API_URL or SESSION_SECRET unset).
 */
export const sso =
    serverEnv.ID_URL && serverEnv.ID_API_URL && serverEnv.SESSION_SECRET
        ? {
              idUrl: serverEnv.ID_URL,
              idApiUrl: serverEnv.ID_API_URL,
              secret: serverEnv.SESSION_SECRET,
              clientId: 'landing-web',
              redirectUri: `${serverEnv.SITE_URL}/auth/callback`,
          }
        : null
export type Sso = NonNullable<typeof sso>

/** The person, as the header shows them. */
export type Account = {
    name: string | null
    email: string
}

export type SiteSession = {
    accessToken: string
    /** ms since epoch */
    accessExpiresAt: number
    refreshToken: string
    sessionId: string
    /** As id-api said at sign-in and again at every refresh: a new name shows within one access token. */
    account: Account
}

/** A sign-in on its way through id-web. */
export type PendingSignIn = {
    state: string
    verifier: string
    returnTo: string
    /** Asked with `prompt=none`: the person did not ask to sign in. */
    silent: boolean
}

export const SESSION_MAX_AGE = 30 * 86_400
export const PENDING_MAX_AGE = 600
/** Refresh when less than this is left of the access token. */
export const REFRESH_BEFORE_MS = 60_000

export const https = () => serverEnv.SITE_URL.startsWith('https://')

/** `__Host-` needs Secure, so plain-http local runs use the bare names. */
export const cookieNames = (secure = https()) => ({
    session: secure ? '__Host-site_session' : 'site_session',
    pending: secure ? '__Host-site_sso' : 'site_sso',
})

export const cookieOptions = (maxAge: number, secure = https()) => ({
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
})

export const sealSession = (config: Sso, session: SiteSession) => seal(session, config.secret, 'site-session')
export const openSession = (config: Sso, value: string | undefined) =>
    unseal<SiteSession>(value, config.secret, 'site-session')
export const openPending = (config: Sso, value: string | undefined) => {
    const pending = unseal<PendingSignIn>(value, config.secret, 'site-sso')
    return pending
        ? {
              ...pending,
              returnTo: safeReturnTo(pending.returnTo),
          }
        : undefined
}

/** The /authorize URL to send the browser to, and the sealed pending cookie meanwhile. */
export function beginSignIn(config: Sso, returnTo: string, silent: boolean) {
    const pending: PendingSignIn = {
        state: randomBytes(24).toString('base64url'),
        verifier: randomBytes(48).toString('base64url'),
        returnTo: safeReturnTo(returnTo),
        silent,
    }
    const url = new URL('/authorize', config.idUrl)
    url.search = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        state: pending.state,
        code_challenge: createHash('sha256').update(pending.verifier).digest('base64url'),
        code_challenge_method: 'S256',
        ...(silent
            ? {
                  prompt: 'none',
              }
            : {}),
    }).toString()
    return {
        url: url.toString(),
        cookie: seal(pending, config.secret, 'site-sso'),
    }
}

export function sameState(given: string | null, expected: string) {
    if (!given) return false
    const a = Buffer.from(given)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
}

type Tokens = {
    accessToken: string
    accessExpiresAt: string
    refreshToken: string
    sessionId: string
}

/** One call to id-api: JSON in and out, a 5 s budget. `undefined` when it could not be asked. */
async function idApi<T>(
    config: Sso,
    path: string,
    options: {
        method?: 'GET' | 'POST'
        token?: string
        body?: unknown
        clientIp?: string
    } = {},
): Promise<
    | {
          status: number
          data: T | undefined
      }
    | undefined
> {
    try {
        const response = await fetch(`${config.idApiUrl}${path}`, {
            method: options.method ?? 'GET',
            headers: {
                accept: 'application/json',
                ...(options.body === undefined
                    ? {}
                    : {
                          'content-type': 'application/json',
                      }),
                ...(options.token
                    ? {
                          authorization: `Bearer ${options.token}`,
                      }
                    : {}),
                ...(options.clientIp
                    ? {
                          'x-forwarded-for': options.clientIp,
                      }
                    : {}),
            },
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            signal: AbortSignal.timeout(5_000),
            cache: 'no-store',
        })
        const text = await response.text()
        return {
            status: response.status,
            data: response.ok && text ? (JSON.parse(text) as T) : undefined,
        }
    } catch {
        return undefined
    }
}

/** Who the tokens belong to, for the header; undefined when id-api could not say. */
async function account(config: Sso, accessToken: string): Promise<Account | undefined> {
    const me = await idApi<{
        email: string
        displayName: string | null
    }>(config, '/api/v1/me', {
        token: accessToken,
    })
    return me?.data
        ? {
              name: me.data.displayName,
              email: me.data.email,
          }
        : undefined
}

const toSession = (tokens: Tokens, who: Account): SiteSession => ({
    accessToken: tokens.accessToken,
    accessExpiresAt: Date.parse(tokens.accessExpiresAt),
    refreshToken: tokens.refreshToken,
    sessionId: tokens.sessionId,
    account: who,
})

export type ExchangeFailure = 'invalid_grant' | 'unavailable'

/** The code from id-web for this site's own session. */
export async function exchangeCode(
    config: Sso,
    code: string,
    verifier: string,
    clientIp?: string,
): Promise<SiteSession | ExchangeFailure> {
    const tokens = await idApi<Tokens>(config, '/api/v1/oauth/token', {
        method: 'POST',
        body: {
            grantType: 'authorization_code',
            clientId: config.clientId,
            redirectUri: config.redirectUri,
            code,
            codeVerifier: verifier,
        },
        clientIp,
    })
    if (!tokens) return 'unavailable'
    if (!tokens.data) return tokens.status >= 500 ? 'unavailable' : 'invalid_grant'
    const who = await account(config, tokens.data.accessToken)
    if (!who) return 'unavailable'
    return toSession(tokens.data, who)
}

/**
 * New tokens for a session that is about to expire, and the account again
 * (a new display name shows). `ended`: id-api refused; `unavailable`: keep
 * the cookie and try on a later request.
 */
export async function refreshSession(
    config: Sso,
    session: SiteSession,
): Promise<SiteSession | 'ended' | 'unavailable'> {
    const tokens = await idApi<Tokens>(config, '/api/v1/sessions/refresh', {
        method: 'POST',
        body: {
            refreshToken: session.refreshToken,
        },
    })
    if (!tokens || tokens.status >= 500) return 'unavailable'
    if (!tokens.data) return 'ended'
    return toSession(tokens.data, (await account(config, tokens.data.accessToken)) ?? session.account)
}

/** Ends this site's session at id-api; signing out here works even when id-api does not answer. */
export async function endSession(config: Sso, session: SiteSession | undefined) {
    if (!session) return
    await idApi(config, '/api/v1/sessions/logout', {
        method: 'POST',
        body: {
            refreshToken: session.refreshToken,
        },
    })
}

/** The client address Traefik set (real-ip), for the rate limits of id-api. */
export function clientIp(headers: { get(name: string): string | null }) {
    const value = headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]
    return value?.trim() || undefined
}
