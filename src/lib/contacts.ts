/** Public profiles of the site's owner: the hero, the contact section, the footer and JSON-LD `sameAs`. */
export const contacts = [
    {
        key: 'platform',
        handle: 'nick-lukashik',
        href: 'https://github.com/nick-lukashik',
    },
    {
        key: 'github',
        handle: 'coping-barrel',
        href: 'https://github.com/coping-barrel',
    },
    {
        key: 'linkedin',
        handle: 'in/nick-lukashik',
        href: 'https://www.linkedin.com/in/nick-lukashik/',
    },
    {
        key: 'telegram',
        handle: '@coping_barrel',
        href: 'https://t.me/coping_barrel',
    },
] as const

export type ContactKey = (typeof contacts)[number]['key']
