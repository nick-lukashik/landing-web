import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { contacts } from '@/lib/contacts'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('home.meta')
    return {
        title: {
            absolute: t('title'),
        },
        description: t('description'),
    }
}

const steps = [
    'discovery',
    'design',
    'build',
    'launch',
    'support',
] as const

export default async function HomePage() {
    const t = await getTranslations('home')
    return (
        <div className="grid gap-16">
            <section className="grid max-w-3xl gap-4">
                <p className="text-sm font-medium text-muted-foreground">{t('role')}</p>
                <h1 className="text-4xl font-bold tracking-tight text-balance">{t('heading')}</h1>
                <p className="text-lg text-muted-foreground text-pretty">{t('lead')}</p>
                <div>
                    <Button
                        asChild
                        size="lg"
                    >
                        <a href="#contact">{t('cta')}</a>
                    </Button>
                </div>
            </section>

            <section
                aria-labelledby="process"
                className="grid gap-6"
            >
                <div className="grid max-w-3xl gap-2">
                    <h2
                        id="process"
                        className="text-2xl font-semibold tracking-tight"
                    >
                        {t('process.title')}
                    </h2>
                    <p className="text-muted-foreground">{t('process.intro')}</p>
                </div>
                <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {steps.map(step => (
                        <li key={step}>
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>{t(`process.steps.${step}.title`)}</CardTitle>
                                    <CardDescription>{t(`process.steps.${step}.body`)}</CardDescription>
                                </CardHeader>
                            </Card>
                        </li>
                    ))}
                </ol>
            </section>

            <section
                id="contact"
                aria-labelledby="contact-title"
                className="grid max-w-3xl scroll-mt-8 gap-4"
            >
                <h2
                    id="contact-title"
                    className="text-2xl font-semibold tracking-tight"
                >
                    {t('contact.title')}
                </h2>
                <p className="text-muted-foreground text-pretty">{t('contact.description')}</p>
                <ul className="flex flex-wrap gap-3">
                    {contacts.map(contact => (
                        <li key={contact.key}>
                            <Button
                                asChild
                                variant="outline"
                            >
                                <a
                                    href={contact.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t(`contact.${contact.key}`)}
                                    <span className="text-muted-foreground">{contact.handle}</span>
                                    <span className="sr-only">({t('contact.opensInNewTab')})</span>
                                </a>
                            </Button>
                        </li>
                    ))}
                </ul>
                <p className="text-sm text-muted-foreground">{t('contact.reply')}</p>
            </section>
        </div>
    )
}
