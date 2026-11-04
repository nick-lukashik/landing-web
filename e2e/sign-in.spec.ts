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

/** "Signed in at id-web" as `email` (the mock reads this cookie), with the hint id-web sets beside it. */
async function signedInAtId(context: BrowserContext, email: string, { hint = true } = {}) {
    await context.addCookies([
        {
            name: 'id_session',
            value: encodeURIComponent(email),
            url: ID_URL,
        },
        ...(hint
            ? [
                  {
                      name: 'nl_hint',
                      value: '1',
                      url: SSO_URL,
                      httpOnly: true,
                  },
              ]
            : []),
    ])
}

const header = (page: Page) => page.getByRole('banner')

async function sessionsAt(page: Page, email: string) {
    const response = await page.request.get(`${ID_URL}/test/sessions?email=${encodeURIComponent(email)}`)
    return (await response.json()) as {
        refresh: number
        live: number
    }
}

test.describe('sign-in through the account site', () => {
    test('"Sign in" signs in here and comes back to the page', async ({ page, context }) => {
        const email = `e2e-${randomUUID()}@example.com`
        await page.goto('/?lang=en')
        await signedInAtId(context, email, {
            hint: false,
        })
        await header(page)
            .getByRole('link', {
                name: en.nav.signIn,
            })
            .click()
        await expect(header(page).getByText(email)).toBeVisible()
        await expect(page).toHaveURL(`${SSO_URL}/`)

        const cookies = await context.cookies(SSO_URL)
        const session = cookies.find(cookie => cookie.name === 'site_session')
        expect(session).toMatchObject({
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

        await header(page)
            .getByRole('button', {
                name: en.nav.signOut,
            })
            .click()
        await expect(
            header(page).getByRole('link', {
                name: en.nav.signIn,
            }),
        ).toBeVisible()
        expect((await sessionsAt(page, email)).live).toBe(0)
    })

    test('a visitor signed in at the account site is signed in here without a click', async ({ page, context }) => {
        const email = `named-${randomUUID()}@example.com`
        await signedInAtId(context, email)
        await page.goto('/?lang=en')
        await expect(header(page).getByText('Named Person')).toBeVisible()
        await expect(page).toHaveURL(`${SSO_URL}/?lang=en`)

        // Signed out at the account site (the hint is gone): the silent session ends here too.
        await context.clearCookies({
            name: 'nl_hint',
        })
        await page.reload()
        await expect(
            header(page).getByRole('link', {
                name: en.nav.signIn,
            }),
        ).toBeVisible()
        expect((await sessionsAt(page, email)).live).toBe(0)
    })

    test('silent sign-in tries once and never loops', async ({ page, context }) => {
        // A hint, but no session at the account site: login_required.
        await context.addCookies([
            {
                name: 'nl_hint',
                value: '1',
                url: SSO_URL,
            },
        ])
        const visits: string[] = []
        page.on('request', request => {
            if (request.isNavigationRequest()) visits.push(new URL(request.url()).pathname)
        })
        await page.goto('/?lang=en')
        await expect(
            header(page).getByRole('link', {
                name: en.nav.signIn,
            }),
        ).toBeVisible()
        expect(visits.filter(path => path === '/auth/sign-in')).toHaveLength(1)
        await page.reload()
        expect(visits.filter(path => path === '/auth/sign-in')).toHaveLength(1)
    })

    test('after "Sign out" here, the account site does not sign the person back in', async ({ page, context }) => {
        const email = `e2e-${randomUUID()}@example.com`
        await signedInAtId(context, email)
        await page.goto('/?lang=en')
        await expect(header(page).getByText(email)).toBeVisible()
        await header(page)
            .getByRole('button', {
                name: en.nav.signOut,
            })
            .click()
        await page.reload()
        await expect(
            header(page).getByRole('link', {
                name: en.nav.signIn,
            }),
        ).toBeVisible()
    })

    test('an expiring token is refreshed before the page, a revoked session ends', async ({ page, context }) => {
        const email = `short-${randomUUID()}@example.com`
        await signedInAtId(context, email, {
            hint: false,
        })
        await page.goto('/auth/sign-in?returnTo=%2F%3Flang%3Den')
        await expect(header(page).getByText(email)).toBeVisible()
        const before = (await sessionsAt(page, email)).refresh
        await page.reload()
        await expect(header(page).getByText(email)).toBeVisible()
        expect((await sessionsAt(page, email)).refresh).toBeGreaterThan(before)

        // "Sign out everywhere" at the account site.
        await page.request.post(`${ID_URL}/test/revoke`, {
            data: {
                email,
            },
        })
        await page.reload()
        await expect(
            header(page).getByRole('link', {
                name: en.nav.signIn,
            }),
        ).toBeVisible()
    })

    test('a cancelled sign-in explains itself and offers another try', async ({ page, context }) => {
        await signedInAtId(context, 'deny', {
            hint: false,
        })
        await page.goto('/auth/sign-in?returnTo=%2F')
        await expect(page).toHaveURL(/\/auth\/error\?reason=denied$/)
        await expect(page.getByText(en.authError.reasons.denied)).toBeVisible()
        await expect(
            page.getByRole('link', {
                name: en.authError.retry,
            }),
        ).toBeVisible()
    })

    test('a callback this browser did not start signs nobody in', async ({ page }) => {
        await page.goto('/auth/callback?code=x&state=forged')
        await expect(page).toHaveURL(/\/auth\/error\?reason=state$/)
        await page.goto('/?lang=en')
        await expect(
            header(page).getByRole('link', {
                name: en.nav.signIn,
            }),
        ).toBeVisible()
    })
})
