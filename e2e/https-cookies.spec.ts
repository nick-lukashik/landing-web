import { type APIResponse } from '@playwright/test'
import { expect, test } from './fixtures'
import { HTTPS_COOKIES_PORT } from './servers'

// The cookies as prod has them. With an https SITE_URL their names start with
// `__Host-`, and a browser ignores a Set-Cookie for such a name without Secure,
// also one that expires it: the cookie stays and the person stays signed in.
test.skip(Boolean(process.env.PW_BASE_URL), 'needs the server started by playwright.config.ts')
test.use({
    baseURL: `http://localhost:${HTTPS_COOKIES_PORT}`,
})

const SESSION = '__Host-site_session'
const PENDING = '__Host-site_sso'

const cookie = (name: string) => ({
    name,
    value: 'does-not-open',
    domain: 'localhost',
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax' as const,
})

const expiring = (response: APIResponse, name: string) =>
    response
        .headersArray()
        .filter(header => header.name.toLowerCase() === 'set-cookie')
        .map(header => header.value)
        .find(value => value.startsWith(`${name}=`))

test('a session cookie that does not open is removed', async ({ page, context }) => {
    await context.addCookies([
        cookie(SESSION),
    ])
    await page.goto('/')
    expect((await context.cookies()).map(item => item.name)).not.toContain(SESSION)
})

// Both redirect to the https SITE_URL, which this server does not serve, so
// these two read the response instead of following it in the browser.
test('a callback expires the pending sign-in cookie with Secure', async ({ request }) => {
    const response = await request.get('/auth/callback?code=x&state=y', {
        maxRedirects: 0,
    })
    expect(expiring(response, PENDING)).toMatch(/;\s*Secure/i)
})

test('sign-out expires the session cookie with Secure', async ({ request }) => {
    const response = await request.post('/auth/sign-out', {
        maxRedirects: 0,
    })
    expect(expiring(response, SESSION)).toMatch(/;\s*Secure/i)
})
