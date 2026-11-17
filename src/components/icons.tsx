import { type ComponentProps } from 'react'
import { type ContactKey } from '@/lib/contacts'
import { type IconName } from '@/lib/content'

type SvgProps = ComponentProps<'svg'>

/** Line icons of the platform parts and the facts, 24px grid, drawn with the current colour. */
const LINE: Record<IconName | 'bike' | 'drone' | 'clock' | 'calendar', string[]> = {
    server: [
        'M4 5h16v6H4zM4 13h16v6H4z',
        'M8 8h.01M8 16h.01',
    ],
    git: [
        'M6 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM6 15.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM18 6.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
        'M6 8.5v7M18 11.5c0 4-6 3-11 4.5',
    ],
    code: [
        'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
        'm9 10-2 2 2 2m6-4 2 2-2 2',
    ],
    shield: [
        'M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z',
        'M12 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM12 13v3',
    ],
    bolt: [
        'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
    ],
    card: [
        'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
        'M3 10h18M7 15h4',
    ],
    brain: [
        'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1Zm6 0a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1',
    ],
    chart: [
        'M4 20V10m6 10V4m6 16v-7m4 7H3',
    ],
    bike: [
        'M5.5 13a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM18.5 13a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
        'M5.5 16.5 9 9h6l3.5 7.5M9 9 7.5 6H6m9 3-3 7.5',
    ],
    drone: [
        'M5 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM19 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM5 16.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM19 16.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
        'M7 7l3 3m4 0 3-3M7 17l3-3m4 0 3 3M10 10h4v4h-4z',
    ],
    clock: [
        'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z',
        'M12 7v5l3 2',
    ],
    calendar: [
        'M5.5 5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
        'M3.5 9.5h17M8 3v4M16 3v4',
    ],
}

export function LineIcon({
    name,
    ...props
}: {
    name: keyof typeof LINE
} & SvgProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            {LINE[name].map(d => (
                <path
                    key={d}
                    d={d}
                />
            ))}
        </svg>
    )
}

const GITHUB =
    'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z'

/** Brand marks of the contacts, filled. */
const BRAND: Record<ContactKey, string> = {
    platform: GITHUB,
    github: GITHUB,
    linkedin:
        'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4V9.5Z',
    telegram:
        'M21.6 4.2 2.9 11.4c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.4-2.3 4.9 3.6c.9.5 1.5.2 1.8-.8L23.4 5.6c.3-1.4-.5-2-1.8-1.4ZM8.6 14.2l10.3-6.5c.5-.3.9-.1.6.2l-8.8 8-.3 3.7-1.8-5.4Z',
}

export function BrandIcon({
    name,
    ...props
}: {
    name: ContactKey
} & SvgProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            <path d={BRAND[name]} />
        </svg>
    )
}
