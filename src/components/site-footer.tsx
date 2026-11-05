import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AnalyticsSettings } from '@/components/analytics-consent'
import { contacts } from '@/lib/contacts'
import { serverEnv } from '@/lib/env/server'

export async function SiteFooter() {
    const t = await getTranslations()
    return (
        <footer className="mt-16 border-t">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
                <p>
                    {t('meta.siteName')} · {t('footer.role')}
                </p>
                <nav aria-label={t('footer.links')}>
                    <ul className="flex flex-wrap gap-4">
                        {contacts.map(contact => (
                            <li key={contact.key}>
                                <a
                                    className="underline-offset-4 hover:underline"
                                    href={contact.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t(`home.contact.${contact.key}`)}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <nav aria-label={t('footer.legal')}>
                    <ul className="flex flex-wrap gap-4">
                        <li>
                            <Link
                                className="underline-offset-4 hover:underline"
                                href="/privacy"
                            >
                                {t('privacy.title')}
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="underline-offset-4 hover:underline"
                                href="/terms"
                            >
                                {t('terms.title')}
                            </Link>
                        </li>
                        {serverEnv.GTM_ID ? (
                            <li>
                                <AnalyticsSettings />
                            </li>
                        ) : null}
                    </ul>
                </nav>
                <p>
                    {t('footer.version', {
                        version: serverEnv.APP_VERSION,
                    })}
                </p>
            </div>
        </footer>
    )
}
