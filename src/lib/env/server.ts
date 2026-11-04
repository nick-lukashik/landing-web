import 'server-only'
import { z } from 'zod'

const blankAsMissing = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value)
const unsetIfBlank = <T extends z.ZodType>(schema: T) => z.preprocess(blankAsMissing, schema)
/** `next build` evaluates route modules too; the image is built without secrets. */
const building = process.env.NEXT_PHASE === 'phase-production-build'

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
        /**
         * Sign-in through the account site. Public origin of id-web
         * (https://id.nick-lukashik.com), id-api inside the cluster, and the key
         * of this site's own sealed session cookie. Without all three the site
         * has no accounts: no sign-in link, the /auth routes answer 404.
         */
        ID_URL: unsetIfBlank(z.url().optional()),
        ID_API_URL: unsetIfBlank(z.url().optional()),
        SESSION_SECRET: building
            ? z.string().optional()
            : unsetIfBlank(z.string().min(32, 'at least 32 characters').optional()),
        /** `noindex` (stage): robots.txt disallows everything, pages say noindex. */
        /** Google Tag Manager container (GTM-ABC1234). Unset: no tag manager, and the CSP stays on this origin. */
        GTM_ID: unsetIfBlank(
            z
                .string()
                .regex(/^GTM-[A-Z0-9]{4,12}$/, 'a container id like GTM-ABC1234')
                .optional(),
        ),
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
        ID_URL: env.ID_URL?.replace(/\/+$/, ''),
        ID_API_URL: env.ID_API_URL?.replace(/\/+$/, ''),
    }))

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
    throw new Error(`Invalid server environment:\n${z.prettifyError(parsed.error)}`)
}
export const serverEnv = parsed.data
