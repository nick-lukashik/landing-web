'use client'

import { Wordmark } from '@nick-lukashik/ui/brand/wordmark'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { type Scene } from './scene'

/** The hero's "Replay intro" button sends this on window. */
export const REPLAY_EVENT = 'nl:replay'

type IntroState = 'playing' | 'named' | 'gone'

/** The intro ran in this tab already: a later visit to the home page starts with the logo drawn. */
let played = false

/**
 * The NL logo behind the home page (a fixed WebGL canvas) and the intro that
 * draws it, Sony-style, on the first load of the home page. `intro` comes from
 * the server (the first request was for `/`), so the overlay is in the HTML
 * from the start; CSS hides the page under it, and shows it at once without
 * JavaScript or with reduced motion. three.js loads only on the home page.
 */
export function NlStage({ intro }: { intro: boolean }) {
    const t = useTranslations('intro')
    const pathname = usePathname()
    const home = pathname === '/'
    const host = useRef<HTMLDivElement>(null)
    const scene = useRef<Scene | null>(null)
    const [state, setState] = useState<IntroState | null>(intro ? 'playing' : null)
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const finish = useEffectEvent(() => {
        played = true
        setState(current => (current ? 'gone' : current))
    })

    // The scene starts the first time the home page shows, and stays (faded out) on the other pages.
    useEffect(() => {
        if (!home || scene.current || !host.current) return
        const element = host.current
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
        let cancelled = false
        let safety: ReturnType<typeof setTimeout> | undefined
        // Its own task after hydration: probing WebGL and loading three.js
        // stay out of the page's first long task.
        const start = setTimeout(() => {
            // Without a GPU (software WebGL) the liquid logo takes the CPU for
            // seconds and freezes the page: go on without it.
            if (!hardwareWebGl()) {
                element.dataset.logo = 'off'
                finish()
                return
            }
            // Never keep the page hidden: if the logo has not started in time, show the page anyway.
            safety = setTimeout(finish, 6000)
            import('./scene')
                .then(({ createScene }) => {
                    if (cancelled) return
                    scene.current = createScene(element, {
                        reduce,
                        skipIntro: played || !intro,
                        onNamed: () => setState(current => (current === 'playing' ? 'named' : current)),
                        onFinish: () => {
                            clearTimeout(safety)
                            finish()
                        },
                    })
                })
                .catch(() => {
                    // No WebGL or the chunk failed: the page goes on without the logo.
                    clearTimeout(safety)
                    finish()
                })
        }, 0)
        return () => {
            cancelled = true
            clearTimeout(start)
            clearTimeout(safety)
        }
    }, [
        home,
        intro,
    ])

    useEffect(() => {
        scene.current?.setActive(home)
    }, [
        home,
    ])

    useEffect(
        () => () => {
            scene.current?.dispose()
            scene.current = null
        },
        [],
    )

    useEffect(() => {
        const replay = () => {
            if (!scene.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return
            setState('playing')
            scene.current.replay()
        }
        addEventListener(REPLAY_EVENT, replay)
        return () => removeEventListener(REPLAY_EVENT, replay)
    }, [])

    // Gone: the overlay fades out (globals.css), then leaves the page.
    useEffect(() => {
        if (state !== 'gone') return
        const timer = setTimeout(() => setState(null), 700)
        return () => clearTimeout(timer)
    }, [
        state,
    ])

    useEffect(() => {
        if (state !== 'playing' && state !== 'named') return
        const skip = (event: KeyboardEvent) => {
            if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                scene.current?.skip()
                finish()
            }
        }
        addEventListener('keydown', skip)
        return () => removeEventListener('keydown', skip)
    }, [
        state,
    ])

    return (
        <>
            {/* The intro comes first: the CSS reaches the canvas and the page after it with ~. */}
            {state ? (
                <div
                    id="intro"
                    data-state={state}
                    className="fixed inset-0 z-[80] grid place-items-end justify-center bg-[radial-gradient(ellipse_at_50%_45%,transparent_0%,rgb(0_0_0/0.55)_70%,#000_100%)] pb-[7vh]"
                >
                    <div aria-hidden="true">
                        {/* 28 KB of path: drawn in the browser, not sent in the HTML of every first visit. */}
                        {mounted ? (
                            <Wordmark className="intro-name mx-auto block h-auto w-[min(300px,56vw)] text-foreground" />
                        ) : null}
                        <p className="intro-boot label mt-4 text-center text-muted-foreground">{t('booting')}</p>
                    </div>
                </div>
            ) : null}
            <div
                ref={host}
                aria-hidden="true"
                className="intro-host pointer-events-none fixed inset-0 z-0"
            />
        </>
    )
}

/**
 * Whether WebGL 2 runs on a GPU. A browser may refuse a context with a major
 * performance caveat when it would emulate one; Chrome does not always, so
 * the renderer's name is checked too (SwiftShader, llvmpipe and the like draw
 * on the CPU).
 */
function hardwareWebGl() {
    const gl = document.createElement('canvas').getContext('webgl2', {
        failIfMajorPerformanceCaveat: true,
    })
    if (!gl) return false
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)
}
