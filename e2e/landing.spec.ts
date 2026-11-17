import { contacts } from '../src/lib/contacts'
import { CALL_URL } from '../src/lib/content'
import { en, expect, ru, test } from './fixtures'

test.describe('landing', () => {
    test('the call to action books a call, in both languages', async ({ page }) => {
        for (const [lang, messages] of [
            [
                'en',
                en,
            ],
            [
                'ru',
                ru,
            ],
        ] as const) {
            await page.goto(`/?lang=${lang}`)
            await expect(
                page.getByRole('heading', {
                    level: 1,
                    name: messages.home.heading,
                }),
            ).toBeVisible()
            await expect(
                page
                    .getByRole('region', {
                        name: messages.home.heading,
                    })
                    .getByRole('link', {
                        name: messages.home.cta,
                    }),
            ).toHaveAttribute('href', CALL_URL)
        }
    })

    test('every profile opens in a new tab, in both languages', async ({ page }) => {
        for (const [lang, messages] of [
            [
                'en',
                en,
            ],
            [
                'ru',
                ru,
            ],
        ] as const) {
            await page.goto(`/?lang=${lang}`)
            const profiles = page.locator('#contact').getByRole('list')
            for (const contact of contacts) {
                const link = profiles.getByRole('link', {
                    name: new RegExp(`^${messages.home.contact[contact.key]}`),
                })
                await expect(link.and(page.locator(`[href="${contact.href}"]`))).toHaveAttribute('target', '_blank')
                await expect(link.and(page.locator(`[href="${contact.href}"]`))).toHaveAttribute(
                    'rel',
                    'noopener noreferrer',
                )
            }
        }
    })

    test('a platform card opens its page, and the page links to the next part', async ({ page }) => {
        await page.goto('/?lang=en')
        await page
            .locator('#platform')
            .getByRole('link', {
                name: new RegExp(`^${en.platform.parts.events.name} `),
            })
            .click()
        await expect(page).toHaveURL(/\/platform\/events$/)
        await expect(
            page.getByRole('heading', {
                level: 1,
                name: en.platform.parts.events.title,
            }),
        ).toBeVisible()
        await page
            .getByRole('link', {
                name: en.platform.next.replace('{name}', en.platform.parts.payments.name),
            })
            .click()
        await expect(page).toHaveURL(/\/platform\/payments$/)
    })

    test('an unknown platform part or note is a 404', async ({ request }) => {
        expect((await request.get('/platform/nothing')).status()).toBe(404)
        expect((await request.get('/blog/nothing')).status()).toBe(404)
    })

    test('JSON-LD names the person and links the profiles', async ({ page }) => {
        await page.goto('/?lang=en')
        const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}')
        const person = data['@graph'].find((node: { '@type': string }) => node['@type'] === 'Person')
        expect(person).toMatchObject({
            name: en.meta.siteName,
            jobTitle: en.footer.role,
            sameAs: contacts.map(contact => contact.href),
        })
    })
})

test.describe('privacy policy and terms', () => {
    test('the footer leads to both, in both languages', async ({ page }) => {
        for (const [lang, catalog] of [
            [
                'en',
                en,
            ],
            [
                'ru',
                ru,
            ],
        ] as const) {
            await page.goto(`/?lang=${lang}`)
            await page
                .getByRole('contentinfo')
                .getByRole('link', {
                    name: catalog.privacy.title,
                })
                .click()
            await expect(page).toHaveURL(/\/privacy$/)
            await expect(
                page.getByRole('heading', {
                    level: 1,
                    name: catalog.privacy.title,
                }),
            ).toBeVisible()
            await page
                .getByRole('contentinfo')
                .getByRole('link', {
                    name: catalog.terms.title,
                })
                .click()
            await expect(page).toHaveURL(/\/terms$/)
            await expect(
                page.getByRole('heading', {
                    level: 1,
                    name: catalog.terms.title,
                }),
            ).toBeVisible()
        }
    })
})

test.describe('without accounts', () => {
    test('there is no sign-in and the /auth routes are 404', async ({ page, request }) => {
        await page.goto('/?lang=en')
        await expect(
            page.getByRole('link', {
                name: en.nav.signIn,
            }),
        ).toHaveCount(0)
        expect((await request.get('/auth/sign-in')).status()).toBe(404)
        expect((await request.post('/auth/sign-out')).status()).toBe(404)
    })
})
