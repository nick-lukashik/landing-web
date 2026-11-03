/**
 * Locale contract. The URL carries no locale: a cookie keeps the choice,
 * `?lang=` overrides it (and rewrites the cookie), `Accept-Language` is the
 * fallback for first visits. src/proxy.ts resolves it once per request.
 */
export const locales = [
    'en',
    'ru',
] as const
export type AppLocale = (typeof locales)[number]
export const defaultLocale: AppLocale = 'en'

export const LOCALE_COOKIE = 'locale'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
/** Request header the proxy sets with the resolved locale. */
export const LOCALE_HEADER = 'x-locale'
/** Query parameter that switches the language and rewrites the cookie. */
export const LOCALE_PARAM = 'lang'

export const ogLocales: Record<AppLocale, string> = {
    en: 'en_US',
    ru: 'ru_RU',
}

export function isLocale(value: unknown): value is AppLocale {
    return typeof value === 'string' && (locales as readonly string[]).includes(value)
}
