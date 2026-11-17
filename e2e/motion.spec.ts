import { en, expect, test } from './fixtures'

// The rest of the suite runs with reduced motion (playwright.config.ts); these tests run with full motion.
test.use({
    reducedMotion: 'no-preference',
})

test.describe('motion', () => {
    test('the intro on the home page never keeps the page hidden', async ({ page }) => {
        // Software WebGL keeps a CI runner busy while the logo draws.
        test.slow()
        await page.goto('/?lang=en', {
            waitUntil: 'domcontentloaded',
        })
        // The logo finishes the intro, or the safety timer does when WebGL is slow or missing.
        // Software WebGL on a busy CI runner is slow, hence the long wait.
        await expect(page.locator('#intro')).toHaveCount(0, {
            timeout: 20_000,
        })
        await expect(page.locator('.site')).toHaveCSS('opacity', '1')
        await expect(
            page.getByRole('heading', {
                level: 1,
                name: en.home.heading,
            }),
        ).toBeVisible()
    })

    test('another page opens through the roulette', async ({ page }) => {
        await page.goto('/blog?lang=en')
        await page
            .getByRole('navigation', {
                name: en.nav.label,
            })
            .getByRole('link', {
                name: en.nav.tools,
            })
            .click()
        await expect(page).toHaveURL(/\/tools$/)
        await expect(
            page.getByRole('heading', {
                level: 1,
                name: en.tools.title,
            }),
        ).toBeVisible()
        await expect(page.locator('.roulette')).toHaveCount(0)
    })
})
