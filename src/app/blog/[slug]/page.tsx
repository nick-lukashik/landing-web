import { Button } from '@nick-lukashik/ui/button'
import { PageHead } from '@nick-lukashik/ui/section'
import { type Metadata, type Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'
import { crumbLink } from '@/components/blocks'
import { findPost, POSTS } from '@/lib/content'

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
    const post = findPost((await params).slug)
    if (!post) return {}
    const t = await getTranslations(`blog.posts.${post.id}`)
    return {
        title: t('title'),
        description: t('lead'),
    }
}

/** A piece of a note: a subheading, a paragraph, a list or a code sample. */
type Block =
    | {
          h: string
      }
    | {
          p: string
      }
    | {
          ul: string[]
      }
    | {
          code: string
      }

function Body({ blocks }: { blocks: Block[] }) {
    return blocks.map((block, i) => {
        const key = `${i}`
        if ('h' in block)
            return (
                <h2
                    key={key}
                    className="display mt-12 mb-4 text-4xl leading-[1.05] font-bold"
                >
                    {block.h}
                </h2>
            )
        if ('p' in block)
            return (
                <p
                    key={key}
                    className="mb-4 text-base text-soft"
                >
                    {block.p}
                </p>
            )
        if ('ul' in block)
            return (
                <ul
                    key={key}
                    className="mb-[18px] border-l border-foreground"
                >
                    {block.ul.map(item => (
                        <li
                            key={item}
                            className="py-1.5 pl-[18px] text-[15px] text-soft"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )
        return (
            <pre
                key={key}
                className="mb-5 overflow-x-auto border border-foreground bg-[#0a0a0a] px-5 py-[18px] text-[13px] leading-relaxed"
            >
                <code>{block.code}</code>
            </pre>
        )
    })
}

/** A note: title, date and topics, a short TL;DR, then the text; links to the neighbours. */
export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
    const post = findPost((await params).slug)
    if (!post) notFound()
    const [t, format] = await Promise.all([
        getTranslations('blog'),
        getFormatter(),
    ])
    const key = `posts.${post.id}` as const
    const index = POSTS.indexOf(post)
    const previous = POSTS[(index + POSTS.length - 1) % POSTS.length] ?? post
    const next = POSTS[(index + 1) % POSTS.length] ?? post
    const short = (title: string) => (title.length > 34 ? `${title.slice(0, 32)}…` : title)

    return (
        <article className="wrap pt-[70px] pb-16 wrap-break-word">
            <PageHead
                crumbs={
                    <>
                        <Link
                            className={crumbLink}
                            href="/blog"
                        >
                            {t('crumb')}
                        </Link>{' '}
                        / {t(`tags.${post.tags[0]}`)}
                    </>
                }
                title={t(`${key}.title`)}
            />
            <p className="label -mt-1.5 mb-6 text-muted-foreground">
                <time dateTime={post.date}>
                    {format.dateTime(new Date(`${post.date}T12:00:00Z`), {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </time>{' '}
                ·{' '}
                {t('readTime', {
                    minutes: post.minutes,
                })}{' '}
                · {post.tags.map(tag => t(`tags.${tag}`)).join(' · ')}
            </p>
            <p className="mb-12 max-w-[760px] text-base text-soft">{t(`${key}.lead`)}</p>
            <section
                aria-labelledby="tldr"
                className="mb-12 max-w-[820px] border border-foreground"
            >
                <h2
                    id="tldr"
                    className="label bg-foreground px-5 py-3.5 font-bold text-background"
                >
                    {t('tldr')}
                </h2>
                <ul className="py-2">
                    {(t.raw(`${key}.tldr`) as string[]).map(item => (
                        <li
                            key={item}
                            className="relative py-2.5 pr-5 pl-11 text-[15px] before:absolute before:left-5 before:text-signal before:content-['→']"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            </section>
            <div className="max-w-[760px]">
                <Body blocks={t.raw(`${key}.body`) as Block[]} />
            </div>
            <nav
                aria-label={t('crumb')}
                className="mt-14 flex flex-col gap-3 border-t border-foreground pt-7 sm:flex-row sm:justify-between sm:gap-4"
            >
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    // A long title wraps on a phone instead of widening the page.
                    className="h-auto min-h-[2.375rem] py-2 whitespace-normal"
                >
                    <Link
                        href={`/blog/${previous.id}` as Route}
                        aria-label={t('previous', {
                            title: t(`posts.${previous.id}.title`),
                        })}
                    >
                        ← {short(t(`posts.${previous.id}.title`))}
                    </Link>
                </Button>
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    // A long title wraps on a phone instead of widening the page.
                    className="h-auto min-h-[2.375rem] py-2 whitespace-normal"
                >
                    <Link
                        href={`/blog/${next.id}` as Route}
                        aria-label={t('next', {
                            title: t(`posts.${next.id}.title`),
                        })}
                    >
                        {short(t(`posts.${next.id}.title`))} →
                    </Link>
                </Button>
            </nav>
        </article>
    )
}
