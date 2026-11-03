import 'server-only'
import { getLocale, getTranslations } from 'next-intl/server'
import { defaultLocale, isLocale, locales, ogLocales } from '@/i18n/config'
import { localizedPath } from './alternates'

/**
 * Open Graph fields every page shares. Next.js merges metadata shallowly, so
 * a page that sets its own `openGraph` (e.g. `type: "article"`) spreads
 * these in to keep the site name, locale and URL.
 */
export async function baseOpenGraph(path: string) {
    const [t, current] = await Promise.all([
        getTranslations('meta'),
        getLocale(),
    ])
    const locale = isLocale(current) ? current : defaultLocale
    return {
        siteName: t('siteName'),
        locale: ogLocales[locale],
        alternateLocale: locales.filter(other => other !== locale).map(other => ogLocales[other]),
        url: localizedPath(path, locale),
    }
}
