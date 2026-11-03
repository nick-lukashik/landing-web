import { defineConfig, devices } from '@playwright/test'
import { NOINDEX_PORT, SITE_PORT } from './e2e/servers'

// The suite runs against the production build (`pnpm build` first), started
// below twice: ROBOTS=index and ROBOTS=noindex. PW_BASE_URL points it at a
// running site instead.
const external = process.env.PW_BASE_URL
const baseURL = external ?? `http://127.0.0.1:${SITE_PORT}`
const site = (port: number, env: Record<string, string>) => ({
    // The same server.js the container runs.
    command: 'node scripts/start-standalone.mjs',
    url: `http://127.0.0.1:${port}/health/live`,
    env: {
        PORT: String(port),
        HOSTNAME: '127.0.0.1',
        SITE_URL: `http://127.0.0.1:${port}`,
        APP_VERSION: 'e2e',
        LOG_LEVEL: 'warn',
        ...env,
    },
    reuseExistingServer: false,
    timeout: 60_000,
})

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    timeout: 30_000,
    expect: {
        timeout: 7_000,
    },
    reporter: process.env.CI
        ? [
              [
                  'list',
              ],
              [
                  'html',
                  {
                      open: 'never',
                  },
              ],
          ]
        : [
              [
                  'list',
              ],
          ],
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
    webServer: external
        ? undefined
        : [
              site(SITE_PORT, {
                  ROBOTS: 'index',
              }),
              site(NOINDEX_PORT, {
                  ROBOTS: 'noindex',
              }),
          ],
})
