'use client'

import { Button } from '@nick-lukashik/ui/button'
import { type Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { LineIcon } from '@/components/icons'
import { type AppLocale } from '@/i18n/config'
import { CALL_URL } from '@/lib/content'
import { type Account } from '@/lib/session/session'
import { cn } from '@/lib/utils'
import { LocaleSwitch } from './locale-switch'

const links = [
    {
        href: '/#platform',
        label: 'platform',
    },
    {
        href: '/#about',
        label: 'about',
    },
    {
        href: '/tools',
        label: 'tools',
    },
    {
        href: '/blog',
        label: 'blog',
    },
    {
        href: '/#experience',
        label: 'experience',
    },
] as const

const quiet = 'label inline-flex h-11 items-center px-2 text-muted-foreground hover:text-foreground'

/**
 * `account`: the person signed in, null when nobody is, undefined while the site
 * has no accounts (no sign-in link then). Sign-in is a plain link to the account
 * site, back to this page; sign-out a plain form: both reload the page anyway.
 * Below 980px the links fold into a menu.
 */
export function SiteHeader({
    languageNames,
    account,
    accountSite,
    site,
}: {
    languageNames: Record<AppLocale, string>
    account?: Account | null
    accountSite?: string
    site: string
}) {
    const t = useTranslations('nav')
    const meta = useTranslations('meta')
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const isCurrent = (href: string) => !href.includes('#') && (pathname === href || pathname.startsWith(`${href}/`))

    const nav = (className: string) =>
        links.map(link => (
            <Link
                key={link.href}
                href={link.href as Route}
                aria-current={isCurrent(link.href) ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={cn(quiet, 'aria-[current=page]:text-foreground', className)}
            >
                {t(link.label)}
            </Link>
        ))

    return (
        <header className="sticky top-0 z-30 border-b border-foreground bg-background">
            <div className="wrap flex h-16 items-center justify-between gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-3.5"
                >
                    <span className="font-display text-2xl leading-none font-bold">NL</span>
                    <span className="label hidden text-[0.6875rem] tracking-[0.2em] text-muted-foreground sm:inline">
                        {meta('siteName')}
                    </span>
                </Link>
                <nav
                    aria-label={t('label')}
                    className="hidden items-center gap-3 min-[980px]:flex"
                >
                    {nav('')}
                </nav>
                <div className="flex items-center gap-1">
                    {account === null ? (
                        <a
                            href={`${accountSite}/login?continue=${encodeURIComponent(`${site}${pathname}`)}`}
                            rel="nofollow"
                            className={cn(quiet, 'hidden sm:inline-flex')}
                        >
                            {t('signIn')}
                        </a>
                    ) : account ? (
                        <>
                            <a
                                href={`${accountSite}/account`}
                                className={cn(quiet, 'hidden sm:inline-flex')}
                                title={
                                    account.email
                                        ? t('signedInAs', {
                                              name: account.email,
                                          })
                                        : undefined
                                }
                            >
                                {account.name ?? account.email ?? t('account')}
                            </a>
                            <form
                                action="/auth/sign-out"
                                method="post"
                            >
                                <button
                                    type="submit"
                                    className={quiet}
                                >
                                    {t('signOut')}
                                </button>
                            </form>
                        </>
                    ) : null}
                    <LocaleSwitch names={languageNames} />
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="ml-2 hidden sm:inline-flex"
                    >
                        <a href={CALL_URL}>
                            <LineIcon name="calendar" />
                            {t('bookCall')}
                        </a>
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="min-[980px]:hidden"
                        aria-expanded={open}
                        aria-controls="site-menu"
                        onClick={() => setOpen(value => !value)}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path d={open ? 'M5 5l14 14M19 5 5 19' : 'M3 7h18M3 12h18M3 17h18'} />
                        </svg>
                        <span className="sr-only">{t('menu')}</span>
                    </Button>
                </div>
            </div>
            <nav
                id="site-menu"
                aria-label={t('menu')}
                hidden={!open}
                className="border-t border-foreground min-[980px]:hidden"
            >
                <div className="wrap flex flex-col py-2">
                    {nav('h-12')}
                    <a
                        href={CALL_URL}
                        className={cn(quiet, 'h-12 text-foreground sm:hidden')}
                    >
                        {t('bookCall')}
                    </a>
                </div>
            </nav>
        </header>
    )
}
