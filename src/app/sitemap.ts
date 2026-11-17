import { type MetadataRoute } from 'next'
import { locales } from '@/i18n/config'
import { PARTS, POSTS } from '@/lib/content'
import { serverEnv } from '@/lib/env/server'
import { languageAlternates, localizedPath } from '@/lib/seo/alternates'

// Per request: SITE_URL is runtime configuration.
export const dynamic = 'force-dynamic'

type Entry = MetadataRoute.Sitemap[number]

/** One entry per language version, each listing all of them as alternates. */
function localized(path: string, extra: Omit<Entry, 'url'> = {}): MetadataRoute.Sitemap {
    const absolute = (url: string) => `${serverEnv.SITE_URL}${url}`
    const languages = Object.fromEntries(
        Object.entries(languageAlternates(path)).map(([lang, url]) => [
            lang,
            absolute(url),
        ]),
    )
    return locales.map(locale => ({
        ...extra,
        url: absolute(localizedPath(path, locale)),
        alternates: {
            languages,
        },
    }))
}

/** Every public page: the landing, the platform parts, the blog and its notes, tools, and the privacy policy and terms. */
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        ...localized('/', {
            changeFrequency: 'weekly',
            priority: 1,
        }),
        ...PARTS.flatMap(part =>
            localized(`/platform/${part.id}`, {
                changeFrequency: 'monthly',
                priority: 0.7,
            }),
        ),
        ...localized('/blog', {
            changeFrequency: 'weekly',
            priority: 0.8,
        }),
        ...POSTS.flatMap(post =>
            localized(`/blog/${post.id}`, {
                lastModified: post.date,
                changeFrequency: 'monthly',
                priority: 0.6,
            }),
        ),
        ...localized('/tools', {
            changeFrequency: 'monthly',
            priority: 0.5,
        }),
        ...localized('/privacy', {
            changeFrequency: 'yearly',
            priority: 0.3,
        }),
        ...localized('/terms', {
            changeFrequency: 'yearly',
            priority: 0.3,
        }),
    ]
}
