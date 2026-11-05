import { expect, test } from './fixtures'

test('a link with UTM marks opens the page as it is, and its canonical URL has none', async ({ page }) => {
    const response = await page.goto('/?utm_source=linkedin&utm_medium=social&utm_campaign=profile')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/\?utm_source=linkedin&utm_medium=social&utm_campaign=profile$/)
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).not.toContain('utm_')
})
