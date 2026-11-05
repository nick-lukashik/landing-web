import { randomUUID } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import { type BrowserContext, type Page } from '@playwright/test'
import { en, expect, test } from './fixtures'
import { ID_PORT, SSO_PORT } from './servers'

const SSO_URL = `http://127.0.0.1:${SSO_PORT}`
const ID_URL = `http://127.0.0.1:${ID_PORT}`

test.skip(Boolean(process.env.PW_BASE_URL), 'needs the mock account site of playwright.config.ts')
test.use({
    baseURL: SSO_URL,
})

// The tag manager's script, answered here: the tests stay off the network.
test.beforeEach(({ page }) =>
    page.route('https://www.googletagmanager.com/gtm.js**', route =>
        route.fulfill({
            contentType: 'text/javascript',
            body: '',
        }),
    ),
)

/** The person the mock account site signs in at /login. */
const signsInAs = (context: BrowserContext, email: string) =>
    context.addCookies([
        {
            name: 'e2e_email',
            value: encodeURIComponent(email),
            url: ID_URL,
        },
    ])

/** Signed in at the account site, and on the main page of this one. */
async function signedIn(page: Page, context: BrowserContext, email: string) {
    await signsInAs(context, email)
    await page.goto(`${ID_URL}/login?continue=${encodeURIComponent(`${SSO_URL}/?lang=en`)}`)
    await expect(page).toHaveURL(`${SSO_URL}/?lang=en`)
}

const header = (page: Page) => page.getByRole('banner')
const signInLink = (page: Page) =>
    header(page).getByRole('link', {
        name: en.nav.signIn,
    })
const signOutButton = (page: Page) =>
    header(page).getByRole('button', {
        name: en.nav.signOut,
    })
const sessionCookie = async (context: BrowserContext) =>
    (await context.cookies(SSO_URL)).find(cookie => cookie.name === 'nl_session')

async function sessionsAt(page: Page, email: string) {
    const response = await page.request.get(`${ID_URL}/test/sessions?email=${encodeURIComponent(email)}`)
    return (await response.json()) as {
        live: number
        me: number
        refreshes: number
    }
}

const revoke = (page: Page, email: string) =>
    page.request.post(`${ID_URL}/test/revoke`, {
        data: {
            email,
        },
    })

test.describe('the account of the shared session cookie', () => {
    test('"Sign in" goes to the account site and comes back signed in; "Sign out" ends it', async ({
        page,
        context,
    }) => {
        const email = `e2e-${randomUUID()}@example.com`
        await signsInAs(context, email)
        await page.goto('/privacy?lang=en')
        await expect(signInLink(page)).toHaveAttribute(
            'href',
            `${ID_URL}/login?continue=${encodeURIComponent(`${SSO_URL}/privacy`)}`,
        )
        await signInLink(page).click()
        await expect(header(page).getByText(email)).toBeVisible()
        await expect(page).toHaveURL(`${SSO_URL}/privacy`)
        expect(await sessionCookie(context)).toMatchObject({
            httpOnly: true,
            sameSite: 'Lax',
        })
        expect(await page.content()).not.toMatch(/at\.[0-9a-f]{8}-/)

        const results = await new AxeBuilder({
            page,
        })
            .withTags([
                'wcag2a',
                'wcag2aa',
                'wcag21aa',
                'wcag22aa',
            ])
            .analyze()
        expect(results.violations).toEqual([])

        await signOutButton(page).click()
        await expect(signInLink(page)).toBeVisible()
        expect((await sessionsAt(page, email)).live).toBe(0)
        expect(await sessionCookie(context)).toBeUndefined()
    })

    test('the header shows the name, with the email for the title', async ({ page, context }) => {
        const email = `named-${randomUUID()}@example.com`
        await signedIn(page, context, email)
        const link = header(page).getByRole('link', {
            name: 'Named Person',
        })
        await expect(link).toHaveAttribute('href', `${ID_URL}/account`)
        await expect(link).toHaveAttribute('title', new RegExp(email))
    })

    test('a page load makes one call, a prefetch or a router fetch none', async ({ page, context }) => {
        const email = `e2e-${randomUUID()}@example.com`
        // Answered already: the banner would cover the footer's link.
        await context.addCookies([
            {
                name: 'nl_consent',
                value: 'denied',
                url: SSO_URL,
            },
        ])
        await signedIn(page, context, email)
        await expect(header(page).getByText(email)).toBeVisible()
        const routerFetches: string[] = []
        page.on('request', request => {
            if (request.headers().rsc) routerFetches.push(request.url())
        })
        const { me } = await sessionsAt(page, email)
        await page.reload()
        await expect(header(page).getByText(email)).toBeVisible()
        expect((await sessionsAt(page, email)).me).toBe(me + 1)

        // A prefetch of the document: a page load in all but its purpose.
        const prefetch = await page.request.get('/?lang=en', {
            headers: {
                accept: 'text/html',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-dest': 'document',
                'sec-purpose': 'prefetch',
            },
        })
        expect(prefetch.ok()).toBe(true)
        expect((await sessionsAt(page, email)).me).toBe(me + 1)

        await page
            .getByRole('contentinfo')
            .getByRole('link', {
                name: en.privacy.title,
            })
            .click()
        await expect(page).toHaveURL(`${SSO_URL}/privacy`)
        await expect(
            page.getByRole('heading', {
                name: en.privacy.title,
                level: 1,
            }),
        ).toBeVisible()
        expect(routerFetches).not.toEqual([])
        expect((await sessionsAt(page, email)).me).toBe(me + 1)
        await expect(header(page).getByText(email)).toBeVisible()
    })

    test('an expiring token is refreshed before the page, once', async ({ page, context }) => {
        const email = `short-${randomUUID()}@example.com`
        await signedIn(page, context, email)
        await expect(header(page).getByText(email)).toBeVisible()
        const first = await sessionCookie(context)
        expect((await sessionsAt(page, email)).refreshes).toBe(1)
        expect(first?.expires).toBeGreaterThan(Date.now() / 1000 + 86_400)

        await page.reload()
        await expect(header(page).getByText(email)).toBeVisible()
        expect((await sessionsAt(page, email)).refreshes).toBe(2)
        expect((await sessionCookie(context))?.value).not.toBe(first?.value)
    })

    test('a refresh id-api refuses signs out at once', async ({ page, context }) => {
        const email = `short-${randomUUID()}@example.com`
        await signedIn(page, context, email)
        await revoke(page, email)
        await page.reload()
        await expect(signInLink(page)).toBeVisible()
        expect(await sessionCookie(context)).toBeUndefined()
    })

    test('a session ended elsewhere is signed out at the next page load', async ({ page, context }) => {
        const email = `e2e-${randomUUID()}@example.com`
        await signedIn(page, context, email)
        await expect(header(page).getByText(email)).toBeVisible()

        // Minutes left on the token: only the answer of id-api can tell.
        await revoke(page, email)
        await page.reload()
        await expect(signInLink(page)).toBeVisible()
        expect(await sessionCookie(context)).toBeUndefined()
    })

    test('id-api not answering leaves the person signed in, as "Account"', async ({ page, context }) => {
        const email = `down-${randomUUID()}@example.com`
        await signedIn(page, context, email)
        await expect(
            header(page).getByRole('link', {
                name: en.nav.account,
            }),
        ).toBeVisible()
        await expect(signOutButton(page)).toBeVisible()
        expect(await sessionCookie(context)).toBeDefined()
    })

    test('a sign-out id-api could not do says so and keeps the session', async ({ page, context }) => {
        const email = `fail-${randomUUID()}@example.com`
        await signedIn(page, context, email)
        await signOutButton(page).click()
        await expect(page).toHaveURL(`${SSO_URL}/auth/error`)
        await expect(page.getByText(en.authError.body)).toBeVisible()
        expect(await sessionCookie(context)).toBeDefined()
        expect((await sessionsAt(page, email)).live).toBe(1)
        await expect(signOutButton(page)).toBeVisible()
    })

    test('answering the consent banner keeps the name, at the cost of one call', async ({ page, context }) => {
        const email = `named-${randomUUID()}@example.com`
        await signedIn(page, context, email)
        const name = header(page).getByRole('link', {
            name: 'Named Person',
        })
        await expect(name).toBeVisible()
        const { me } = await sessionsAt(page, email)
        const banner = page.getByRole('region', {
            name: en.consent.label,
        })
        // Pressed until the page has come alive: the button is there before its handler is.
        await expect(async () => {
            await banner
                .getByRole('button', {
                    name: en.consent.accept,
                })
                .click({
                    timeout: 1_000,
                })
            await expect(banner).toBeHidden({
                timeout: 1_000,
            })
        }).toPass()
        await expect
            .poll(async () => (await context.cookies(SSO_URL)).find(cookie => cookie.name === 'nl_consent')?.value)
            .toBe('granted')
        await expect.poll(async () => (await sessionsAt(page, email)).me).toBe(me + 1)
        await expect(name).toBeVisible()
    })

    test('the browser cannot say who the person is', async ({ page }) => {
        const forged = encodeURIComponent(
            JSON.stringify({
                name: 'Forged Person',
                email: null,
            }),
        )
        const response = await page.request.get('/?lang=en', {
            headers: {
                'x-nl-account': forged,
            },
        })
        expect(await response.text()).not.toContain('Forged Person')

        // Where the proxy does not run: nothing breaks, and the answer is for the sender alone.
        for (const value of [
            forged,
            '%',
            encodeURIComponent('{"name":{"a":1},"email":null}'),
        ]) {
            const elsewhere = await page.request.get('/api/nowhere', {
                headers: {
                    'x-nl-account': value,
                },
            })
            expect(elsewhere.status()).toBe(404)
            expect(elsewhere.headers()['cache-control']).toContain('no-store')
        }
    })

    test('a sign-out from another origin does nothing', async ({ page, context }) => {
        const email = `e2e-${randomUUID()}@example.com`
        await signedIn(page, context, email)
        const response = await page.request.post('/auth/sign-out', {
            headers: {
                origin: 'https://elsewhere.example',
            },
            maxRedirects: 0,
        })
        expect(response.status()).toBe(403)
        expect((await sessionsAt(page, email)).live).toBe(1)
    })
})
