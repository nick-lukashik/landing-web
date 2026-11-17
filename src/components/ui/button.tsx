import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { Slot } from 'radix-ui'
import type * as React from 'react'

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center border font-mono font-bold tracking-[0.1em] whitespace-nowrap uppercase outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                // Mono Brutal: white on black and back again on hover, no transitions.
                default: 'border-foreground bg-foreground text-background hover:bg-background hover:text-foreground',
                outline: 'border-foreground bg-background text-foreground hover:bg-foreground hover:text-background',
                ghost: 'border-transparent text-muted-foreground hover:text-foreground',
                link: 'border-transparent text-foreground underline underline-offset-4',
            },
            size: {
                default: 'h-[3.125rem] gap-2.5 px-6 text-[0.8125rem]',
                sm: 'h-[2.375rem] gap-2 px-3.5 text-[0.6875rem]',
                lg: 'h-14 gap-3 px-7 text-sm',
                icon: 'size-11',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

function Button({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot.Root : 'button'

    return (
        <Comp
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(
                buttonVariants({
                    variant,
                    size,
                    className,
                }),
            )}
            {...props}
        />
    )
}

export { Button, buttonVariants }
