import { type Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { crumbLink, PageHead } from '@/components/blocks'
import { FilterList } from '@/components/filter-list'
import { TOOL_CATEGORIES, TOOLS } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('tools.meta')
    return {
        title: t('title'),
        description: t('description'),
    }
}

/** What I work with and what each tool is for, by area. */
export default async function ToolsPage() {
    const [t, nav] = await Promise.all([
        getTranslations('tools'),
        getTranslations('nav'),
    ])
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
                options={TOOL_CATEGORIES.map(category => ({
                    id: category,
                    name: t(`categories.${category}`),
                }))}
            >
                <ul className="grid border-t border-l border-foreground min-[620px]:grid-cols-2 min-[980px]:grid-cols-4">
                    {TOOLS.map(tool => (
                        <li
                            key={tool.id}
                            data-tags={tool.category}
                            className="border-r border-b border-foreground p-[22px]"
                        >
                            <p className="label text-[0.6875rem] text-muted-foreground">
                                {t(`categories.${tool.category}`)}
                            </p>
                            <h2 className="display mt-2.5 mb-2 text-2xl font-bold tracking-[0.02em]">{tool.name}</h2>
                            <p className="text-sm text-muted-foreground">{t(`items.${tool.id}`)}</p>
                        </li>
                    ))}
                </ul>
            </FilterList>
        </div>
    )
}
