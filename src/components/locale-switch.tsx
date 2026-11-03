'use client'

import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { type AppLocale, locales } from '@/i18n/config'
import { localizedPath } from '@/lib/seo/alternates'
import { cn } from '@/lib/utils'

/**
 * Plain links to the same page with `?lang=`: the proxy rewrites the cookie
 * and the whole document (including <html lang>) renders in the new
 * language. Works without JavaScript and doubles as hreflang links.
 */
export function LocaleSwitch({ names }: { names: Record<AppLocale, string> }) {
    const t = useTranslations('nav')
    const current = useLocale()
    const pathname = usePathname()

    return (
        <nav
            aria-label={t('language')}
            className="flex items-center gap-1"
        >
            {locales.map(locale => (
                // A full page load on purpose: the root layout must re-render in the new language.
                <a
                    key={locale}
                    href={localizedPath(pathname, locale)}
                    hrefLang={locale}
                    lang={locale}
                    aria-current={locale === current ? 'true' : undefined}
                    className={cn(
                        'inline-flex h-9 items-center rounded-md px-2.5 text-sm text-muted-foreground hover:text-foreground',
                        'aria-[current]:bg-muted aria-[current]:font-medium aria-[current]:text-foreground',
                    )}
                >
                    <span aria-hidden="true">{locale.toUpperCase()}</span>
                    <span className="sr-only">{names[locale]}</span>
                </a>
            ))}
        </nav>
    )
}
