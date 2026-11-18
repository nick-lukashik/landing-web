import { FilterList } from '@nick-lukashik/ui/filter-list'
import { PageHead } from '@nick-lukashik/ui/section'
import { type Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { crumbLink, PostRow } from '@/components/blocks'
import { POSTS, type TagId } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('blog.meta')
    return {
        title: t('title'),
        description: t('description'),
    }
}

/** Every note, newest first, with a topic filter. */
export default async function BlogPage() {
    const [t, nav] = await Promise.all([
        getTranslations('blog'),
        getTranslations('nav'),
    ])
    const tags = [
        ...new Set<TagId>(POSTS.flatMap(post => post.tags)),
    ]
    return (
        <div className="wrap pt-[70px] pb-16">
            <PageHead
                crumbs={
                    <>
                        <Link
                            className={crumbLink}
                            href="/"
                        >
                            {nav('home')}
                        </Link>{' '}
                        / {t('crumb')}
                    </>
                }
                title={t('title')}
                intro={t('intro')}
            />
            <FilterList
                label={t('filter')}
                all={t('all')}
                options={tags.map(tag => ({
                    id: tag,
                    name: t(`tags.${tag}`),
                }))}
            >
                <ul className="border-t border-foreground">
                    {POSTS.map(post => (
                        <PostRow
                            key={post.id}
                            post={post}
                        />
                    ))}
                </ul>
            </FilterList>
        </div>
    )
}
