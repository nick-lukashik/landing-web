'use client'

import { type ComponentProps, useEffect, useRef } from 'react'
import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from './paths'

/** How far a letter drifts, in viewBox units per 100 units of height, and how far it turns. */
const DRIFT_X = 0.9
const DRIFT_Y = 1.3
const TURN_DEG = 0.9

/**
 * The wordmark with every letter floating on its own slow path, as if the
 * letters hung in the air. Each letter mixes a few sines with random speeds and
 * phases, so the motion never visibly repeats. Still with reduced motion and
 * while off screen; the transforms are set from the browser, which the CSP allows.
 */
export function FloatingWordmark(props: ComponentProps<'svg'>) {
    const ref = useRef<SVGSVGElement>(null)

    useEffect(() => {
        const svg = ref.current
        if (!svg || matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const letters = [
            ...svg.querySelectorAll<SVGGElement>('g'),
        ]
        // Per letter: five waves, each a random speed and phase.
        const wave = () => ({
            speed: 0.25 + Math.random() * 0.55,
            phase: Math.random() * Math.PI * 2,
        })
        const paths = letters.map(letter => ({
            letter,
            x1: wave(),
            x2: wave(),
            y1: wave(),
            y2: wave(),
            turn: wave(),
        }))
        const unit = svg.viewBox.baseVal.height / 100
        let visible = true
        const observer = new IntersectionObserver(entries => {
            visible = entries.some(entry => entry.isIntersecting)
        })
        observer.observe(svg)
        let frame = 0
        const tick = (now: number) => {
            if (visible) {
                const t = now / 1000
                for (const { letter, x1, x2, y1, y2, turn } of paths) {
                    const x =
                        (Math.sin(t * x1.speed + x1.phase) * 0.6 + Math.sin(t * x2.speed * 1.7 + x2.phase) * 0.4)
                        * DRIFT_X
                        * unit
                    const y =
                        (Math.sin(t * y1.speed + y1.phase) * 0.6 + Math.sin(t * y2.speed * 1.9 + y2.phase) * 0.4)
                        * DRIFT_Y
                        * unit
                    const r = Math.sin(t * turn.speed + turn.phase) * TURN_DEG
                    letter.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg)`
                }
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
        }
    }, [])

    return (
        <svg
            ref={ref}
            viewBox={WORDMARK_VIEWBOX}
            fill="currentColor"
            overflow="visible"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            {WORDMARK_LETTERS.map(d => (
                <g
                    key={d.slice(0, 32)}
                    className="float-letter"
                >
                    <path
                        fillRule="evenodd"
                        d={d}
                    />
                </g>
            ))}
        </svg>
    )
}
