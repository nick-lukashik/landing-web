// Ports of the servers playwright.config.ts starts; specs and fixtures read them from here.
// PW_SITE_PORT, PW_NOINDEX_PORT, PW_SSO_PORT, PW_HTTPS_COOKIES_PORT and PW_ID_PORT move them,
// so two runs on one machine do not collide.

const port = (name: string, fallback: number) => Number(process.env[name] || fallback)

/** The site, ROBOTS=index (the default baseURL). */
export const SITE_PORT = port('PW_SITE_PORT', 3100)
/** The same build again with ROBOTS=noindex: indexing is runtime config. */
export const NOINDEX_PORT = port('PW_NOINDEX_PORT', 3101)
/** The same build with accounts on, signing in through e2e/mock-id.mjs. */
export const SSO_PORT = port('PW_SSO_PORT', 3102)
/**
 * The same again with an https SITE_URL, so its cookies have the `__Host-` names
 * of prod. It serves plain http: Chromium accepts Secure cookies on localhost.
 */
export const HTTPS_COOKIES_PORT = port('PW_HTTPS_COOKIES_PORT', 3103)
/** e2e/mock-id.mjs: id-web's /authorize and the id-api calls of this site. */
export const ID_PORT = port('PW_ID_PORT', 3290)
