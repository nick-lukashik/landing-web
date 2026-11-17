'use client'

import { type Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

export type RoulettePage = {
    path: string
    name: string
    hint: string
}

type Tile = RoulettePage & {
    key: string
}

const TILES = 52
const TARGET = 44
const SPIN_MS = 1250
const SETTLE_MS = 220

/**
 * Going to another page is a roulette spin: a strip of page names flies past
 * a marker and stops on the page asked for, then slides up to show it. Only
 * plain clicks on links within the site; hash links on the same page,
 * new tabs, back and forward, and reduced motion navigate as usual.
 */
export function RouteRoulette({ pages }: { pages: RoulettePage[] }) {
    const t = useTranslations('roulette')
    const router = useRouter()
    const pathname = usePathname()
    const [spin, setSpin] = useState<{
        target: RoulettePage
        tiles: Tile[]
        href: string
        from: string
    } | null>(null)
    const [phase, setPhase] = useState<'spin' | 'won' | 'out'>('spin')
    const strip = useRef<HTMLDivElement>(null)

    // Catch clicks before Next's own link handler (capture phase on window).
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            const anchor = event.target instanceof Element ? event.target.closest('a') : null
            if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
            const url = new URL(anchor.href, location.href)
            if (url.origin !== location.origin || url.pathname === location.pathname) return
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
            const target = pages.find(page => page.path === url.pathname) ?? {
                path: url.pathname,
                name: anchor.textContent?.trim() || url.pathname,
                hint: t('pageHint'),
            }
            event.preventDefault()
            event.stopPropagation()
            const tiles: Tile[] = Array.from(
                {
                    length: TILES,
                },
                (_, i) => {
                    const page =
                        i === TARGET
                            ? target
                            : (pages[(i * 7 + Math.floor(Math.random() * 5)) % pages.length] ?? target)
                    return {
                        ...page,
                        key: `${i}`,
                    }
                },
            )
            setPhase('spin')
            setSpin({
                target,
                tiles,
                href: `${url.pathname}${url.search}${url.hash}`,
                from: location.pathname,
            })
        }
        addEventListener('click', onClick, {
            capture: true,
        })
        return () =>
            removeEventListener('click', onClick, {
                capture: true,
            })
    }, [
        pages,
        t,
    ])

    // The spin itself: ease out on a random spot of the target tile, then settle on its centre.
    useEffect(() => {
        const element = strip.current
        if (!spin || phase !== 'spin' || !element) return
        const tile = element.firstElementChild?.getBoundingClientRect().width ?? 240
        const centre = innerWidth / 2
        const x0 = centre - 2.5 * tile
        const x1 = centre - (TARGET + 0.5) * tile
        const offset = (Math.random() - 0.5) * tile * 0.7
        const start = performance.now()
        const tiles = element.children
        let hot = -1
        let frame = 0
        const ease = (x: number) => 1 - (1 - x) ** 4
        const step = (now: number) => {
            const progress = Math.min(1, (now - start) / SPIN_MS)
            let x = x0 + (x1 + offset - x0) * ease(progress)
            if (progress >= 1) {
                const settle = Math.min(1, (now - start - SPIN_MS) / SETTLE_MS)
                x = x1 + offset * (1 - settle) ** 3
                if (settle >= 1) {
                    element.style.transform = `translate3d(${x1}px,0,0)`
                    setPhase('won')
                    return
                }
            }
            element.style.transform = `translate3d(${x}px,0,0)`
            const i = Math.floor((centre - x) / tile)
            if (i !== hot) {
                tiles[hot]?.removeAttribute('data-hot')
                tiles[i]?.setAttribute('data-hot', '')
                hot = i
            }
            frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frame)
    }, [
        spin,
        phase,
    ])

    // Won: open the page behind the overlay.
    useEffect(() => {
        if (!spin || phase !== 'won') return
        const timer = setTimeout(() => router.push(spin.href as Route), 260)
        return () => clearTimeout(timer)
    }, [
        spin,
        phase,
        router,
    ])

    // The new page is there (or it took too long): slide the overlay away.
    useEffect(() => {
        if (!spin || phase !== 'won') return
        if (pathname !== spin.from) {
            setPhase('out')
            return
        }
        const timer = setTimeout(() => setPhase('out'), 3000)
        return () => clearTimeout(timer)
    }, [
        spin,
        phase,
        pathname,
    ])

    if (!spin) return null
    return (
        <div
            aria-hidden="true"
            data-state={phase}
            className="roulette fixed inset-0 z-[70] flex flex-col justify-center gap-6 bg-background"
            onTransitionEnd={() => {
                if (phase === 'out') setSpin(null)
            }}
        >
            <p className="label text-center text-muted-foreground">
                {t('opening', {
                    name: spin.target.name,
                })}
            </p>
            <div className="roulette-rail relative h-[clamp(150px,24vh,230px)] overflow-hidden border-y border-foreground">
                <div
                    ref={strip}
                    className="absolute inset-y-0 left-0 flex will-change-transform"
                >
                    {spin.tiles.map((tile, i) => (
                        <div
                            key={tile.key}
                            data-win={phase !== 'spin' && i === TARGET ? '' : undefined}
                            className="flex w-[clamp(170px,22vw,300px)] flex-none flex-col justify-between border-r border-line px-5 py-[18px] data-hot:bg-secondary data-win:bg-foreground data-win:text-background"
                        >
                            <span className="label text-[0.6875rem] text-muted-foreground in-data-win:text-background">
                                {String(i % 100).padStart(2, '0')} / {tile.hint}
                            </span>
                            <span className="display text-[clamp(30px,3.4vw,52px)] leading-none">{tile.name}</span>
                        </div>
                    ))}
                </div>
                <div className="roulette-marker absolute inset-y-[-1px] left-1/2 -ml-px w-0.5 bg-signal" />
            </div>
            <p className="label text-center text-muted-foreground">{t('site')}</p>
        </div>
    )
}
