// Ports of the servers playwright.config.ts starts; specs and fixtures read them from here.

/** The site, ROBOTS=index (the default baseURL). */
export const SITE_PORT = 3100
/** The same build again with ROBOTS=noindex: indexing is runtime config. */
export const NOINDEX_PORT = 3101
