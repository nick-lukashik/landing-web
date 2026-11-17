import { type Metadata, type Route } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PostRow, SectionHead, Socials } from '@/components/blocks'
import { Architecture } from '@/components/home/architecture'
import { ReplayButton } from '@/components/home/replay-button'
import { LineIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { FloatingWordmark } from '@/components/wordmark/floating-wordmark'
import { contacts } from '@/lib/contacts'
import { CALL_URL, PARTS, POSTS } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('home.meta')
    return {
        title: {
            absolute: t('title'),
        },
        description: t('description'),
    }
}

type Stat = {
    value: string
    label: string
}

type Row = {
    term: string
    value: string
}

type Job = {
    when: string
    company: string
    role: string
    body: string
    wins: string[]
}

const FACTS = [
    {
        id: 'cycling',
        icon: 'bike',
    },
    {
        id: 'drone',
        icon: 'drone',
    },
    {
        id: 'routine',
        icon: 'clock',
    },
] as const

/** The catalog marks a few words with <b>…</b>; everything else is plain text. */
function Bold({ text }: { text: string }) {
    return text.split(/<b>(.*?)<\/b>/).map((piece, i) =>
        i % 2 ? (
            <b
                // biome-ignore lint/suspicious/noArrayIndexKey: pieces of one sentence, in order
                key={i}
                className="font-medium text-foreground"
            >
                {piece}
            </b>
        ) : (
            piece
        ),
    )
}

const telegram = contacts.find(contact => contact.key === 'telegram') ?? contacts[0]

const section = 'relative border-t border-foreground bg-background py-[90px] sm:py-[110px]'

export default async function HomePage() {
    const [t, parts] = await Promise.all([
        getTranslations('home'),
        getTranslations('platform.parts'),
    ])
    const ticker = t.raw('ticker') as string[]
    const stats = t.raw('about.stats') as Stat[]
    const text = t.raw('about.text') as string[]
    const rows = t.raw('about.sheet.rows') as Row[]
    const jobs = t.raw('experience.jobs') as Job[]

    return (
        <>
            <section
                aria-labelledby="hero-title"
                className="relative flex min-h-[calc(100svh-4rem)] items-end pb-[90px] min-[980px]:items-center min-[980px]:pb-16"
            >
                <div className="wrap">
                    <div className="max-w-[560px] pt-[42vh] min-[620px]:pt-[44vh] min-[980px]:pt-0">
                        <p className="label mb-7 flex items-center gap-2.5 text-muted-foreground">
                            <span className="live-dot" />
                            {t('role')}
                        </p>
                        <h1
                            id="hero-title"
                            className="mb-7"
                        >
                            <span className="sr-only">{t('heading')}</span>
                            <FloatingWordmark className="block h-auto w-full max-w-[560px] text-foreground" />
                        </h1>
                        <p className="mb-9 max-w-[520px] text-base text-soft">{t('lead')}</p>
                        <div className="mb-7 flex flex-wrap gap-3">
                            <Button asChild>
                                <a href={CALL_URL}>
                                    <LineIcon name="calendar" />
                                    {t('cta')}
                                </a>
                            </Button>
                        </div>
                        <Socials />
                    </div>
                </div>
                <ReplayButton className="absolute right-8 bottom-14 hidden min-[980px]:inline-flex" />
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 flex h-10 items-center overflow-hidden border-t border-foreground bg-background"
                >
                    <div className="ticker-track label flex gap-12 whitespace-nowrap text-muted-foreground">
                        {[
                            ...ticker,
                            ...ticker,
                        ].map((item, i) => (
                            <span
                                // biome-ignore lint/suspicious/noArrayIndexKey: the line repeats on purpose, so items are not unique
                                key={i}
                                className="flex items-center gap-2"
                            >
                                {i % ticker.length === 0 ? <span className="live-dot" /> : null}
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section
                id="platform"
                aria-labelledby="platform-title"
                className={section}
            >
                <div className="wrap">
                    <SectionHead
                        id="platform-title"
                        label={t('platform.label')}
                        title={t('platform.title')}
                        intro={t('platform.intro')}
                    />
                    <Architecture label={t('platform.archLabel')} />
                    <ul className="grid border-t border-l border-foreground min-[620px]:grid-cols-2 min-[980px]:grid-cols-4">
                        {PARTS.map(part => (
                            <li
                                key={part.id}
                                className="reveal"
                            >
                                <Link
                                    href={`/platform/${part.id}` as Route}
                                    className="group flex h-full min-h-[250px] flex-col gap-2.5 border-r border-b border-foreground p-[26px] hover:bg-foreground hover:text-background"
                                >
                                    <span className="flex items-center justify-between">
                                        <span className="grid size-[38px] place-items-center border border-foreground group-hover:border-background">
                                            <LineIcon
                                                name={part.icon}
                                                className="size-[19px]"
                                            />
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className="live-dot"
                                        />
                                    </span>
                                    <span className="display mt-1.5 text-[32px] leading-[1.05] font-bold">
                                        {parts(`${part.id}.name`)}
                                    </span>
                                    <span className="label text-muted-foreground group-hover:text-background">
                                        {part.stack.join(' · ')}
                                    </span>
                                    <span className="mt-auto text-[13px] text-muted-foreground group-hover:text-background">
                                        <span className="label block text-[0.6875rem]">{t('platform.why')}</span>
                                        {parts(`${part.id}.why`)}
                                    </span>
                                    <span className="label underline underline-offset-4">{t('platform.more')} →</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section
                id="about"
                aria-labelledby="about-title"
                className={section}
            >
                <div className="wrap">
                    <SectionHead
                        id="about-title"
                        label={t('about.label')}
                        title={t('about.title')}
                        intro={t('about.intro')}
                    />
                    <ul className="reveal mb-14 grid border border-foreground min-[620px]:grid-cols-3">
                        {stats.map(stat => (
                            <li
                                key={stat.value}
                                className="border-foreground px-6 py-[22px] not-last:border-b min-[620px]:not-last:border-r min-[620px]:not-last:border-b-0"
                            >
                                <span className="display block text-[64px] leading-none font-bold">{stat.value}</span>
                                <span className="label mt-2.5 block tracking-[0.06em] text-muted-foreground">
                                    {stat.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="grid gap-12 min-[980px]:grid-cols-[1.25fr_1fr]">
                        <div className="reveal grid content-start gap-[18px] text-base text-soft">
                            {text.map((paragraph, i) => (
                                <p
                                    // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs come from the catalog in a fixed order
                                    key={i}
                                >
                                    <Bold text={paragraph} />
                                </p>
                            ))}
                        </div>
                        <ul className="reveal grid content-start">
                            {FACTS.map(fact => (
                                <li
                                    key={fact.id}
                                    className="flex items-start gap-4 border border-foreground p-5 not-first:border-t-0"
                                >
                                    <span className="grid size-[38px] flex-none place-items-center border border-foreground">
                                        <LineIcon
                                            name={fact.icon}
                                            className="size-[18px]"
                                        />
                                    </span>
                                    <div className="grow">
                                        <h3 className="display text-[22px] font-bold">
                                            {t(`about.facts.${fact.id}.title`)}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {t(`about.facts.${fact.id}.body`)}
                                        </p>
                                        {fact.id === 'drone' ? (
                                            <p className="label mt-3 grid h-[120px] place-items-center border border-dashed border-line text-[0.6875rem] text-muted-foreground">
                                                {t('about.facts.drone.photos')}
                                            </p>
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <section
                        aria-labelledby="sheet-title"
                        className="reveal mt-14 border border-foreground"
                    >
                        <h3
                            id="sheet-title"
                            className="label bg-foreground px-5 py-3.5 font-bold text-background"
                        >
                            {t('about.sheet.title')}
                        </h3>
                        <dl>
                            {rows.map(row => (
                                <div
                                    key={row.term}
                                    className="grid border-line not-last:border-b min-[980px]:grid-cols-[200px_1fr]"
                                >
                                    <dt className="label px-5 pt-3.5 text-muted-foreground min-[980px]:border-r min-[980px]:border-line min-[980px]:pb-3.5">
                                        {row.term}
                                    </dt>
                                    <dd className="px-5 py-3.5 text-[15px]">{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>
            </section>

            <section
                id="notes"
                aria-labelledby="notes-title"
                className={section}
            >
                <div className="wrap">
                    <SectionHead
                        id="notes-title"
                        label={t('notes.label')}
                        title={t('notes.title')}
                        intro={t('notes.intro')}
                    />
                    <ul className="reveal border-t border-foreground">
                        {POSTS.slice(0, 3).map(post => (
                            <PostRow
                                key={post.id}
                                post={post}
                            />
                        ))}
                    </ul>
                    <Button
                        asChild
                        variant="outline"
                        className="mt-7"
                    >
                        <Link href="/blog">{t('notes.all')} →</Link>
                    </Button>
                </div>
            </section>

            <section
                id="experience"
                aria-labelledby="experience-title"
                className={section}
            >
                <div className="wrap">
                    <SectionHead
                        id="experience-title"
                        label={t('experience.label')}
                        title={t('experience.title')}
                        intro={t('experience.intro')}
                    />
                    <ol className="reveal border-t border-foreground">
                        {jobs.map(job => (
                            <li
                                key={job.company}
                                className="grid items-baseline gap-2 border-b border-foreground py-7 min-[980px]:grid-cols-[200px_1fr_auto] min-[980px]:gap-7"
                            >
                                <p className="label text-muted-foreground">{job.when}</p>
                                <div>
                                    <h3 className="display text-4xl leading-[1.05] font-bold">{job.company}</h3>
                                    <p className="mt-1 max-w-[620px] text-sm text-muted-foreground">{job.body}</p>
                                    {job.wins.length ? (
                                        <ul className="mt-3 flex flex-wrap gap-1.5">
                                            {job.wins.map(win => (
                                                <li
                                                    key={win}
                                                    className="label border border-line px-2.5 py-1 text-[0.6875rem] tracking-[0.06em] text-soft"
                                                >
                                                    {win}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                                <p className="label justify-self-start border border-foreground px-3.5 py-1.5 text-[0.6875rem] tracking-[0.1em] whitespace-nowrap">
                                    {job.role}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section
                id="contact"
                aria-labelledby="contact-title"
                className="relative scroll-mt-8 border-t border-foreground bg-background pt-[150px] pb-[90px] text-center"
            >
                <div className="wrap">
                    <p className="label reveal mb-5 flex items-center justify-center gap-2.5 text-muted-foreground">
                        <span className="live-dot" />
                        {t('contact.label')}
                    </p>
                    <h2
                        id="contact-title"
                        className="display reveal mb-5 text-[clamp(80px,14vw,220px)]"
                    >
                        {t('contact.title')}
                    </h2>
                    <p className="reveal mb-9 text-base text-soft">{t('contact.description')}</p>
                    <div className="reveal mb-7 flex flex-wrap justify-center gap-3">
                        <Button asChild>
                            <a href={CALL_URL}>{t('contact.book')}</a>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                        >
                            <a href={telegram.href}>{t('contact.write')}</a>
                        </Button>
                    </div>
                    <Socials className="reveal justify-center" />
                </div>
            </section>
        </>
    )
}
