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

test('a session cookie that does not open is removed', async ({ page, context }) => {
    await context.addCookies([
        cookie(SESSION),
    ])
    await page.goto('/')
    expect((await context.cookies()).map(item => item.name)).not.toContain(SESSION)
})

test('a callback removes the pending sign-in cookie', async ({ page, context }) => {
    await context.addCookies([
        cookie(PENDING),
    ])
    await page.goto('/auth/callback?code=x&state=y')
    expect((await context.cookies()).map(item => item.name)).not.toContain(PENDING)
})

test('sign-out expires the session cookie with Secure', async ({ request }) => {
    const response = await request.post('/auth/sign-out', {
        maxRedirects: 0,
    })
    const expired = response
        .headersArray()
        .filter(header => header.name.toLowerCase() === 'set-cookie')
        .map(header => header.value)
        .find(value => value.startsWith(`${SESSION}=`))
    expect(expired).toMatch(/;\s*Secure/i)
})
