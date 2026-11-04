import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { sso } from '@/lib/sso/sso'

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
}

const REASONS = [
    'state',
    'denied',
    'failed',
    'unavailable',
] as const

/** A sign-in the person asked for did not work: what happened, and a way to try again. */
export default async function AuthErrorPage({ searchParams }: PageProps<'/auth/error'>) {
    if (!sso) notFound()
    const t = await getTranslations('authError')
    const { reason } = await searchParams
    const known = REASONS.find(value => value === reason) ?? 'failed'
    return (
        <div className="mx-auto flex max-w-md flex-col items-start gap-4 py-10">
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            <p>{t(`reasons.${known}`)}</p>
            <Button asChild>
                <a
                    href="/auth/sign-in"
                    rel="nofollow"
                >
                    {t('retry')}
                </a>
            </Button>
        </div>
    )
}
