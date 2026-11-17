import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { contacts } from '@/lib/contacts'

const link = 'label hover:text-foreground'

export async function SiteFooter() {
    const t = await getTranslations()
    return (
        <footer className="relative z-[2] border-t border-foreground bg-background">
            <div className="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-7 text-muted-foreground">
                <p className="label">
                    {t('meta.siteName')} · {t('footer.hosted')}
                </p>
                <nav aria-label={t('footer.links')}>
                    <ul className="flex flex-wrap gap-5">
                        {contacts.map(contact => (
                            <li key={contact.key}>
                                <a
                                    className={link}
                                    href={contact.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t(`home.contact.${contact.key}`)}
                                    {contact.key === 'platform' || contact.key === 'github'
                                        ? ` · ${contact.handle}`
                                        : ''}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <nav aria-label={t('footer.legal')}>
                    <ul className="flex flex-wrap gap-5">
                        <li>
                            <Link
                                className={link}
                                href="/privacy"
                            >
                                {t('privacy.title')}
                            </Link>
                        </li>
                        <li>
                            <Link
                                className={link}
                                href="/terms"
                            >
                                {t('terms.title')}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </footer>
    )
}
