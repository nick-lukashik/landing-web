import { type Metadata, type Viewport } from 'next'
import { cookies, headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { AnalyticsConsent } from '@/components/analytics-consent'
import { JsonLd } from '@/components/json-ld'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { type AppLocale, defaultLocale, isLocale, locales } from '@/i18n/config'
import { CONSENT_COOKIE, consentAnswer } from '@/lib/analytics/consent'
import { contacts } from '@/lib/contacts'
import { serverEnv } from '@/lib/env/server'
import { NONCE_HEADER } from '@/lib/security/csp'
import { CANONICAL_HEADER, languageAlternates, localizedPath, PATHNAME_HEADER } from '@/lib/seo/alternates'
import { baseOpenGraph } from '@/lib/seo/metadata'
import { ACCOUNT_HEADER, accountFromHeader, accounts } from '@/lib/session/session'
import './globals.css'

/**
 * Site-wide metadata. Pages set only their title and description; the
 * canonical URL, hreflang alternates and og:url come from the request path
 * (x-pathname and x-canonical-path, set by the proxy), og/twitter title and description are
 * filled in by Next.js from the page's own.
 */
export async function generateMetadata(): Promise<Metadata> {
    const [t, locale, requestHeaders] = await Promise.all([
        getTranslations('meta'),
        getLocale(),
        headers(),
    ])
    const path = requestHeaders.get(PATHNAME_HEADER) ?? '/'
    const lang = isLocale(locale) ? locale : defaultLocale
    const noindex = serverEnv.ROBOTS === 'noindex'
    return {
        metadataBase: new URL(serverEnv.SITE_URL),
        title: {
            default: t('siteName'),
            template: `%s · ${t('siteName')}`,
        },
        description: t('description'),
        applicationName: t('siteName'),
        alternates: {
            canonical: requestHeaders.get(CANONICAL_HEADER) ?? localizedPath(path, lang),
            languages: languageAlternates(path),
        },
        openGraph: {
            type: 'website',
            ...(await baseOpenGraph(path)),
        },
        twitter: {
            card: 'summary_large_image',
        },
        // Indexing is the default; 404s get Next.js' own noindex, so nothing to repeat.
        robots: noindex
            ? {
                  index: false,
                  follow: false,
              }
            : undefined,
        formatDetection: {
            telephone: false,
            email: false,
            address: false,
        },
    }
}

// One light theme: --background in globals.css.
export const viewport: Viewport = {
    colorScheme: 'light',
    themeColor: '#ffffff',
}

/** Each language's name in that language (`meta.languageName` of its own catalog). */
async function languageNames(): Promise<Record<AppLocale, string>> {
    const names = await Promise.all(
        locales.map(async locale => {
            const t = await getTranslations({
                locale,
                namespace: 'meta',
            })
            return [
                locale,
                t('languageName'),
            ] as const
        }),
    )
    return Object.fromEntries(names) as Record<AppLocale, string>
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
    const [locale, requestHeaders, t, names] = await Promise.all([
        getLocale(),
        headers(),
        getTranslations(),
        languageNames(),
    ])
    const nonce = requestHeaders.get(NONCE_HEADER) ?? undefined
    const site = serverEnv.SITE_URL
    // What the proxy found; null when nobody is signed in, undefined while the site has no accounts.
    const account = accounts ? accountFromHeader(requestHeaders.get(ACCOUNT_HEADER)) : undefined

    return (
        <html lang={locale}>
            <body className="flex min-h-dvh flex-col">
                <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow"
                >
                    {t('nav.skip')}
                </a>
                <NextIntlClientProvider>
                    <SiteHeader
                        languageNames={names}
                        account={account}
                        accountSite={accounts?.idUrl}
                        site={site}
                    />
                    <main
                        id="main"
                        className="mx-auto w-full max-w-5xl flex-1 px-4 py-10"
                    >
                        {children}
                    </main>
                    <SiteFooter />
                    {serverEnv.GTM_ID ? (
                        <AnalyticsConsent
                            id={serverEnv.GTM_ID}
                            answer={consentAnswer((await cookies()).get(CONSENT_COOKIE)?.value)}
                            privacyUrl={'/privacy'}
                        />
                    ) : null}
                </NextIntlClientProvider>
                <JsonLd
                    nonce={nonce}
                    data={{
                        '@context': 'https://schema.org',
                        '@graph': [
                            {
                                '@type': 'WebSite',
                                '@id': `${site}/#website`,
                                url: `${site}/`,
                                name: t('meta.siteName'),
                                description: t('meta.description'),
                                inLanguage: locale,
                                publisher: {
                                    '@id': `${site}/#person`,
                                },
                            },
                            {
                                '@type': 'Person',
                                '@id': `${site}/#person`,
                                name: t('meta.siteName'),
                                jobTitle: t('footer.role'),
                                url: `${site}/`,
                                sameAs: contacts.map(contact => contact.href),
                            },
                        ],
                    }}
                />
            </body>
        </html>
    )
}
