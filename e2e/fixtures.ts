import { test as base, expect } from '@playwright/test'
import en from '../src/i18n/messages/en.json' with { type: 'json' }
import ru from '../src/i18n/messages/ru.json' with { type: 'json' }
import { NOINDEX_PORT } from './servers'

/** UI strings come from the catalogs, so a copy change does not break tests. */
export { en, ru }

const external = Boolean(process.env.PW_BASE_URL)

/**
 * The same build started with ROBOTS=noindex (playwright.config.ts). Against
 * PW_BASE_URL it is set only by PW_NOINDEX_URL; without it those tests skip.
 */
export const NOINDEX_URL = process.env.PW_NOINDEX_URL ?? (external ? undefined : `http://127.0.0.1:${NOINDEX_PORT}`)

type Fixtures = {
    /** CSP violations reported by the page; the test fails if any are left. */
    cspViolations: string[]
}

/** Every test fails on any Content Security Policy violation the page reports. */
export const test = base.extend<Fixtures>({
    cspViolations: [
        async ({ page }, use) => {
            const violations: string[] = []
            page.on('console', message => {
                if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) {
                    violations.push(message.text())
                }
            })
            await use(violations)
            expect(violations, 'CSP violations').toEqual([])
        },
        {
            auto: true,
        },
    ],
})

export { expect }
