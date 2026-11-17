import { en, expect, test } from './fixtures'

test.describe('blog and tools', () => {
    test('the topic filter narrows the notes and a note opens', async ({ page }) => {
        await page.goto('/blog?lang=en')
        const notes = page.getByRole('main').getByRole('listitem')
        await expect(notes).toHaveCount(3)
        await page
            .getByRole('group', {
                name: en.blog.filter,
            })
            .getByRole('button', {
                name: en.blog.tags.testing,
            })
            .click()
        await expect(
            notes.filter({
                visible: true,
            }),
        ).toHaveCount(1)
        await page
            .getByRole('link', {
                name: new RegExp(en.blog.posts['failure-tests'].title),
            })
            .click()
        await expect(
            page.getByRole('heading', {
                level: 1,
                name: en.blog.posts['failure-tests'].title,
            }),
        ).toBeVisible()
        await expect(
            page.getByRole('heading', {
                level: 2,
                name: en.blog.tldr,
            }),
        ).toBeVisible()
    })

    test('the tools filter shows one area', async ({ page }) => {
        await page.goto('/tools?lang=en')
        const tools = page.getByRole('main').getByRole('listitem')
        await expect(tools).toHaveCount(12)
        await page
            .getByRole('button', {
                name: en.tools.categories.ai,
                exact: true,
            })
            .click()
        await expect(
            tools.filter({
                visible: true,
            }),
        ).toHaveCount(3)
    })
})
