import { type Metadata, type Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { crumbLink, PageHead } from '@/components/blocks'
import { BrandIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { findPart, PARTS } from '@/lib/content'

export async function generateMetadata({ params }: PageProps<'/platform/[part]'>): Promise<Metadata> {
    const part = findPart((await params).part)
    if (!part) return {}
    const t = await getTranslations(`platform.parts.${part.id}`)
    return {
        title: t('title'),
        description: t('intro'),
    }
}

const panel = 'border border-foreground p-7'

function Points({ title, items }: { title: string; items: string[] }) {
    return (
        <section className={`${panel} not-first:border-t-0`}>
            <h2 className="display mb-4 text-[22px] font-bold tracking-[0.03em]">{title}</h2>
            <ul className="grid gap-3">
                {items.map(item => (
                    <li
                        key={item}
                        className="relative pl-5 text-[15px] text-soft before:absolute before:top-[0.65em] before:left-0 before:h-px before:w-2 before:bg-foreground"
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </section>
    )
}

/** One part of the platform: how it works, its trade-offs, what proves it, why it is built so, and the code. */
export default async function PartPage({ params }: PageProps<'/platform/[part]'>) {
    const part = findPart((await params).part)
    if (!part) notFound()
    const [t, nav] = await Promise.all([
        getTranslations('platform'),
        getTranslations('nav'),
    ])
    const key = `parts.${part.id}` as const
    const index = PARTS.indexOf(part)
    const previous = PARTS[(index + PARTS.length - 1) % PARTS.length] ?? part
    const next = PARTS[(index + 1) % PARTS.length] ?? part

    return (
        <article className="wrap pt-[70px] pb-16">
            <PageHead
                crumbs={
                    <>
                        <Link
                            className={crumbLink}
                            href={'/#platform' as Route}
                        >
                            {t('crumb')}
                        </Link>{' '}
                        / {t(`${key}.name`)}
                    </>
                }
                title={t(`${key}.title`)}
                intro={t(`${key}.intro`)}
            />
            <div className="grid items-start min-[980px]:grid-cols-[1.4fr_1fr]">
                <div>
                    <Points
                        title={t('how')}
                        items={t.raw(`${key}.how`) as string[]}
                    />
                    <Points
                        title={t('trade')}
                        items={t.raw(`${key}.trade`) as string[]}
                    />
                    <Points
                        title={t('proof')}
                        items={t.raw(`${key}.proof`) as string[]}
                    />
                </div>
                <section className={`${panel} border-t-0 min-[980px]:border-t min-[980px]:border-l-0`}>
                    <h2 className="display mb-4 text-[22px] font-bold tracking-[0.03em]">{t('why')}</h2>
                    <p className="mb-[18px] text-[15px] text-soft">{t(`${key}.reason`)}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-2">
                        {part.stack.map(name => (
                            <li
                                key={name}
                                className="label border border-line px-3 py-1 text-[0.6875rem] tracking-[0.08em]"
                            >
                                {name}
                            </li>
                        ))}
                    </ul>
                    <h3 className="sr-only">{t('code')}</h3>
                    <ul className="mt-[18px] flex flex-col gap-2.5">
                        {part.repos.map(repo => (
                            <li key={repo.name}>
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                >
                                    <a
                                        href={repo.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <BrandIcon name="github" />
                                        {repo.name}
                                        {'private' in repo && repo.private ? ` (${t('private')})` : ''} ↗
                                    </a>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
            <nav
                aria-label={nav('platform')}
                className="mt-14 flex justify-between gap-4 border-t border-foreground pt-7"
            >
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                >
                    <Link
                        href={`/platform/${previous.id}` as Route}
                        aria-label={t('previous', {
                            name: t(`parts.${previous.id}.name`),
                        })}
                    >
                        ← {t(`parts.${previous.id}.name`)}
                    </Link>
                </Button>
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                >
                    <Link
                        href={`/platform/${next.id}` as Route}
                        aria-label={t('next', {
                            name: t(`parts.${next.id}.name`),
                        })}
                    >
                        {t(`parts.${next.id}.name`)} →
                    </Link>
                </Button>
            </nav>
        </article>
    )
}
