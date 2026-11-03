import { contacts } from '../src/lib/contacts'
import { en, expect, ru, test } from './fixtures'

test.describe('landing', () => {
    test('the call to action leads to the contacts', async ({ page }) => {
        await page.goto('/?lang=en')
        await page
            .getByRole('link', {
                name: en.home.cta,
            })
            .click()
        await expect(page).toHaveURL(/#contact$/)
        await expect(
            page.getByRole('heading', {
                level: 2,
                name: en.home.contact.title,
            }),
        ).toBeInViewport()
    })

    test('every contact opens the profile in a new tab, in both languages', async ({ page }) => {
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
            const section = page.locator('#contact')
            for (const contact of contacts) {
                const link = section.getByRole('link', {
                    name: new RegExp(messages.home.contact[contact.key]),
                })
                await expect(link).toHaveAttribute('href', contact.href)
                await expect(link).toHaveAttribute('target', '_blank')
                await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
            }
        }
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
