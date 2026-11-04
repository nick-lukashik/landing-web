// Ports of the servers playwright.config.ts starts; specs and fixtures read them from here.

/** The site, ROBOTS=index (the default baseURL). */
export const SITE_PORT = 3100
/** The same build again with ROBOTS=noindex: indexing is runtime config. */
export const NOINDEX_PORT = 3101
/** The same build with accounts on, signing in through e2e/mock-id.mjs. */
export const SSO_PORT = 3102
/** e2e/mock-id.mjs: id-web's /authorize and the id-api calls of this site. */
export const ID_PORT = 3290
