/**
 * Short links for the places the site is linked from: `/c/acme` goes to the home
 * page with the UTM marks of a cover letter for Acme. A new link needs nothing
 * here, only a new label in its address; a new place needs a line.
 */
export const shortLinks = [
    {
        prefix: 'c',
        source: 'cover-letter',
        medium: 'application',
    },
    {
        prefix: 'r',
        source: 'resume',
        medium: 'application',
    },
    {
        prefix: 'l',
        source: 'linkedin',
        medium: 'social',
    },
    {
        prefix: 'g',
        source: 'github',
        medium: 'social',
    },
    {
        prefix: 't',
        source: 'telegram',
        medium: 'social',
    },
    {
        prefix: 'h',
        source: 'hh',
        medium: 'job-board',
    },
] as const

export const shortLinkRedirects = () =>
    shortLinks.map(({ prefix, source, medium }) => ({
        source: `/${prefix}/:label([a-z0-9-]{1,60})`,
        destination: `/?utm_source=${source}&utm_medium=${medium}&utm_campaign=:label`,
        permanent: false,
    }))
