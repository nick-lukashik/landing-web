'use client'

import { useTranslations } from 'next-intl'
import { REPLAY_EVENT } from '@/components/nl/nl-stage'
import { cn } from '@/lib/utils'

/** Plays the logo intro again (src/components/nl/nl-stage.tsx listens). */
export function ReplayButton({ className }: { className?: string }) {
    const t = useTranslations('intro')
    return (
        <button
            type="button"
            className={cn(
                'label items-center gap-2 text-muted-foreground hover:text-foreground motion-reduce:hidden',
                className,
            )}
            onClick={() => window.dispatchEvent(new Event(REPLAY_EVENT))}
        >
            <span aria-hidden="true">↻</span>
            {t('replay')}
        </button>
    )
}
