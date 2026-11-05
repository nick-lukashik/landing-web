import { shortLinks } from '../src/lib/short-links'
import { expect, test } from './fixtures'

test.describe('short links', () => {
    for (const { prefix, source, medium } of shortLinks) {
        test(`/${prefix}/acme goes home with the marks of ${source}`, async ({ request }) => {
            const response = await request.get(`/${prefix}/acme`, {
                maxRedirects: 0,
            })
            expect(response.status()).toBe(307)
            expect(response.headers().location).toBe(`/?utm_source=${source}&utm_medium=${medium}&utm_campaign=acme`)
        })
    }

    test('the page opens with the marks in its address, and its canonical URL has none', async ({ page }) => {
        await page.goto('/c/acme')
        await expect(page).toHaveURL(/\/\?utm_source=cover-letter&utm_medium=application&utm_campaign=acme$/)
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
        expect(canonical).not.toContain('utm_')
    })

    test('a label that does not fit is not a link', async ({ request }) => {
        for (const path of [
            '/c/a_b',
            '/c/acme/more',
        ]) {
            const response = await request.get(path, {
                maxRedirects: 0,
            })
            expect(response.status(), path).toBe(404)
        }
    })
})
