import { type MetadataRoute } from 'next'

/** Never crawled: the API proxy, probes and Next.js internals. */
const PRIVATE_PATHS = [
    '/api/',
    '/health/',
]

export function buildRobots(mode: 'index' | 'noindex', siteUrl: string): MetadataRoute.Robots {
    if (mode === 'noindex') {
        return {
            rules: {
                userAgent: '*',
                disallow: '/',
            },
        }
    }
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: PRIVATE_PATHS,
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
