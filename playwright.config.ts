import { defineConfig, devices } from '@playwright/test'
import { HTTPS_COOKIES_PORT, ID_PORT, NOINDEX_PORT, SITE_PORT, SSO_PORT } from './e2e/servers'

// The suite runs against the production build (`pnpm build` first), started
// below three times: ROBOTS=index and ROBOTS=noindex without accounts, and
// with accounts on against e2e/mock-id.mjs. PW_BASE_URL points it at a
// running site instead (the sign-in tests skip then).
const external = process.env.PW_BASE_URL
const baseURL = external ?? `http://127.0.0.1:${SITE_PORT}`
// Test only: the sealed cookie of this run, shared by the mock account site and the site.
const SESSION_SECRET = 'e2e-site-session-secret-0123456789abcdef'
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
                  GTM_ID: 'GTM-E2ETEST',
              }),
              {
                  command: 'node e2e/mock-id.mjs',
                  url: `http://127.0.0.1:${ID_PORT}/health`,
                  env: {
                      PORT: String(ID_PORT),
                      SESSION_SECRET,
                  },
                  reuseExistingServer: false,
                  timeout: 30_000,
              },
              // As prod: accounts and the tag manager, whose consent re-renders the header.
              site(SSO_PORT, {
                  ROBOTS: 'index',
                  GTM_ID: 'GTM-E2ETEST',
                  ID_URL: `http://127.0.0.1:${ID_PORT}`,
                  ID_API_URL: `http://127.0.0.1:${ID_PORT}`,
                  SESSION_SECRET,
              }),
              site(HTTPS_COOKIES_PORT, {
                  ROBOTS: 'index',
                  SITE_URL: `https://localhost:${HTTPS_COOKIES_PORT}`,
                  ID_URL: `http://127.0.0.1:${ID_PORT}`,
                  ID_API_URL: `http://127.0.0.1:${ID_PORT}`,
                  SESSION_SECRET,
              }),
          ],
})
