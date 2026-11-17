import { getTranslations } from 'next-intl/server'
import { contacts } from '@/lib/contacts'

type Section = {
    title: string
    items: string[]
}

/** /privacy and /terms: a title, an intro, sections of plain points, and how to reach the owner. */
export async function LegalPage({ namespace }: { namespace: 'privacy' | 'terms' }) {
    const [t, legal] = await Promise.all([
        getTranslations(namespace),
        getTranslations('legal'),
    ])
    const sections = t.raw('sections') as Section[]
    const telegram = contacts.find(contact => contact.key === 'telegram')
    return (
        <article className="wrap grid gap-10 pt-[70px] pb-16 *:max-w-3xl">
            <header className="grid gap-3">
                <h1 className="display text-[clamp(44px,6vw,96px)] text-balance">{t('title')}</h1>
                <p className="text-sm text-muted-foreground">{legal('updated')}</p>
                <p className="text-base text-pretty text-soft">{t('intro')}</p>
            </header>
            {sections.map(section => (
                <section
                    key={section.title}
                    className="grid gap-3"
                >
                    <h2 className="display text-4xl">{section.title}</h2>
                    <ul className="grid list-disc gap-2 pl-5 text-pretty text-soft">
                        {section.items.map(item => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>
            ))}
            <section className="grid gap-3">
                <h2 className="display text-4xl">{legal('contact')}</h2>
                <p>
                    {legal.rich('contactText', {
                        handle: telegram?.handle ?? '',
                        link: chunks => (
                            <a
                                className="underline underline-offset-4"
                                href={telegram?.href}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                </p>
            </section>
        </article>
    )
}
