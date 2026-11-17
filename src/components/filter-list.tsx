'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

/**
 * Buttons that narrow a server-rendered list: every item carries its topics
 * in `data-tags`, and the buttons hide what does not match. Without
 * JavaScript the whole list stays visible.
 */
export function FilterList({
    label,
    all,
    options,
    children,
}: {
    label: string
    all: string
    options: {
        id: string
        name: string
    }[]
    children: ReactNode
}) {
    const [current, setCurrent] = useState<string | null>(null)
    const list = useRef<HTMLDivElement>(null)

    useEffect(() => {
        for (const item of list.current?.querySelectorAll<HTMLElement>('[data-tags]') ?? []) {
            item.hidden = current !== null && !(item.dataset.tags ?? '').split(' ').includes(current)
        }
    }, [
        current,
    ])

    const button = (id: string | null, name: string) => (
        <button
            key={id ?? 'all'}
            type="button"
            aria-pressed={current === id}
            onClick={() => setCurrent(id)}
            className="label -mr-px h-9 border border-foreground px-4 text-[0.6875rem] tracking-[0.1em] aria-pressed:bg-foreground aria-pressed:text-background"
        >
            {name}
        </button>
    )

    return (
        <>
            <fieldset className="mb-7 flex flex-wrap">
                <legend className="sr-only">{label}</legend>
                {button(null, all)}
                {options.map(option => button(option.id, option.name))}
            </fieldset>
            <div ref={list}>{children}</div>
        </>
    )
}
