import 'server-only'
import { z } from 'zod'

const blankAsMissing = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value)
const unsetIfBlank = <T extends z.ZodType>(schema: T) => z.preprocess(blankAsMissing, schema)

/**
 * Server-only configuration, read at runtime (one image for every
 * environment). Parsed on first import: instrumentation.ts imports it at
 * startup, so a bad value stops the server instead of failing every page.
 */
const schema = z
    .object({
        /** Public origin of this site: canonical URLs, sitemap, Open Graph. */
        SITE_URL: unsetIfBlank(z.url().default('http://localhost:3000')),
        /** Build or release identifier, sent as x-app-version. */
        APP_VERSION: unsetIfBlank(z.string().max(64).default('dev')),
        LOG_LEVEL: unsetIfBlank(
            z
                .enum([
                    'fatal',
                    'error',
                    'warn',
                    'info',
                    'debug',
                    'trace',
                    'silent',
                ])
                .default('info'),
        ),
        /** `noindex` (stage): robots.txt disallows everything, pages say noindex. */
        ROBOTS: unsetIfBlank(
            z
                .enum([
                    'index',
                    'noindex',
                ])
                .default('index'),
        ),
    })
    .transform(env => ({
        ...env,
        SITE_URL: env.SITE_URL.replace(/\/+$/, ''),
    }))

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
    throw new Error(`Invalid server environment:\n${z.prettifyError(parsed.error)}`)
}
export const serverEnv = parsed.data
