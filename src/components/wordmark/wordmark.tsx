import { type ComponentProps } from 'react'
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from './paths'

/** The custom NICK LUKASHIK wordmark as one shape. Decorative: the text goes next to it. */
export function Wordmark(props: ComponentProps<'svg'>) {
    return (
        <svg
            viewBox={WORDMARK_VIEWBOX}
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            <path
                fillRule="evenodd"
                d={WORDMARK_PATH}
            />
        </svg>
    )
}
