import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LegalPage } from '@/components/legal-page'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('terms')
    return {
        title: t('meta.title'),
        description: t('meta.description'),
    }
}

export default function Page() {
    return <LegalPage namespace="terms" />
}
