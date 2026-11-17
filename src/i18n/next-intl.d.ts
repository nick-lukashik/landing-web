import type { AppLocale } from './config'
import type messages from './messages/en.json'

/**
 * Lists in the catalogs (legal sections, blog paragraphs, platform points) are
 * read whole with `t.raw()`. Typed as leaves, they keep their array methods out
 * of the key union, which otherwise grows past what TypeScript resolves.
 */
type Keys<T> = T extends readonly unknown[] ? string : T extends object ? { [K in keyof T]: Keys<T[K]> } : T

// Typed locales and message keys for useTranslations/getTranslations.
declare module 'next-intl' {
    // biome-ignore lint/style/useConsistentTypeDefinitions: augmentation must merge into next-intl's AppConfig interface.
    interface AppConfig {
        Locale: AppLocale
        Messages: Keys<typeof messages>
    }
}
