import { type Route } from 'next'
import Link from 'next/link'
import { getFormatter, getTranslations } from 'next-intl/server'
import { type ReactNode } from 'react'
import { BrandIcon } from '@/components/icons'
import { contacts } from '@/lib/contacts'
import { type POSTS } from '@/lib/content'
import { cn } from '@/lib/utils'

/** A section's opening: label and big title on the left, a short intro on the right. */
export function SectionHead({ id, label, title, intro }: { id: string; label: string; title: string; intro: string }) {
    return (
        <div className="reveal mb-14 grid items-end gap-10 min-[980px]:grid-cols-2">
            <div>
                <p className="label mb-4 text-muted-foreground">{label}</p>
                <h2
                    id={id}
                    className="display text-[clamp(44px,5.6vw,88px)]"
                >
                    {title}
                </h2>
            </div>
            <p className="max-w-[520px] text-base text-soft">{intro}</p>
        </div>
    )
}

/** A page of its own: breadcrumb, title, intro. */
export function PageHead({ crumbs, title, intro }: { crumbs: ReactNode; title: string; intro?: string }) {
    return (
        <>
            <p className="label mb-6 text-muted-foreground">{crumbs}</p>
            <h1 className="display mb-5 max-w-[1000px] text-[clamp(44px,6vw,96px)]">{title}</h1>
            {intro ? <p className="mb-12 max-w-[760px] text-base text-soft">{intro}</p> : null}
        </>
    )
}

export const crumbLink = 'hover:text-foreground'

/** The profiles as small outlined chips. */
export async function Socials({ className }: { className?: string }) {
    const t = await getTranslations('home.contact')
    return (
        <ul className={cn('flex flex-wrap gap-2', className)}>
            {contacts.map(contact => (
                <li key={contact.key}>
                    <a
                        href={contact.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="label inline-flex h-[34px] items-center gap-2 border border-line px-3 text-[0.6875rem] tracking-[0.08em] hover:border-foreground hover:bg-foreground hover:text-background"
                    >
                        <BrandIcon
                            name={contact.key}
                            className="size-[15px]"
                        />
                        {t(contact.key)}
                        {contact.key === 'platform' || contact.key === 'github' ? ` · ${contact.handle}` : ''}
                        <span className="sr-only">({t('opensInNewTab')})</span>
                    </a>
                </li>
            ))}
        </ul>
    )
}

export type PostEntry = (typeof POSTS)[number]

/** One note in a list: date, title and lead, topics, reading time. */
export async function PostRow({ post }: { post: PostEntry }) {
    const [t, format] = await Promise.all([
        getTranslations('blog'),
        getFormatter(),
    ])
    return (
        <li data-tags={post.tags.join(' ')}>
            <Link
                href={`/blog/${post.id}` as Route}
                className="group grid items-baseline gap-1.5 border-b border-foreground py-6 hover:-mx-4 hover:bg-foreground hover:px-4 hover:text-background min-[980px]:grid-cols-[150px_1fr_220px_110px] min-[980px]:gap-6"
            >
                <span className="label text-muted-foreground group-hover:text-background">
                    <time dateTime={post.date}>
                        {format.dateTime(new Date(`${post.date}T12:00:00Z`), {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </time>
                </span>
                <span>
                    <span className="display block text-3xl leading-[1.05]">{t(`posts.${post.id}.title`)}</span>
                    <span className="mt-2 block max-w-[620px] text-sm text-soft group-hover:text-background">
                        {t(`posts.${post.id}.lead`)}
                    </span>
                </span>
                <span className="label text-muted-foreground group-hover:text-background">
                    {post.tags.map(tag => t(`tags.${tag}`)).join(' · ')}
                </span>
                <span className="label min-[980px]:text-right">
                    {t('minutes', {
                        minutes: post.minutes,
                    })}{' '}
                    →
                </span>
            </Link>
        </li>
    )
}
