import { expect, test } from './fixtures'
import { HTTPS_COOKIES_PORT } from './servers'

// The cookie as prod has it. With an https SITE_URL its name starts with `__Secure-`,
// and a browser ignores a Set-Cookie for such a name without Secure, also one that
// expires it: the cookie stays and the person stays signed in.
test.skip(Boolean(process.env.PW_BASE_URL), 'needs the server started by playwright.config.ts')
test.use({
    baseURL: `http://localhost:${HTTPS_COOKIES_PORT}`,
})

const SESSION = '__Secure-nl_session'

test('a session cookie that does not open is removed', async ({ page, context }) => {
    await context.addCookies([
        {
            name: SESSION,
            value: 'does-not-open',
            domain: 'localhost',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'Lax',
        },
    ])
    await page.goto('/')
    expect((await context.cookies()).map(item => item.name)).not.toContain(SESSION)
})

// It redirects to the https SITE_URL, which this server does not serve, so this one
// reads the response instead of following it in the browser.
test('sign-out expires the session cookie with Secure', async ({ request }) => {
    const response = await request.post('/auth/sign-out', {
        maxRedirects: 0,
    })
    const expiring = response
        .headersArray()
        .filter(header => header.name.toLowerCase() === 'set-cookie')
        .map(header => header.value)
        .find(value => value.startsWith(`${SESSION}=`))
    expect(expiring).toMatch(/;\s*Secure/i)
})
