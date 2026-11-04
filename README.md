# landing-web

The site on `https://nick-lukashik.com`: one page in English and Russian with who I am, how I work and where to reach me. Made from [`next-starter`](https://github.com/nick-lukashik/next-starter) (`.template-version`); the design is stock shadcn/ui, the text and links come from the previous site (`outegro-dev/platform`, `apps/landing-web`).

Everything the starter documents applies here: commands, SEO, CSP, health probes, Docker, CI and deploy (see its README). Only what is specific to this site is below.

## Content

| What | Where |
|---|---|
| Text, both languages (same keys; a unit test checks it) | `src/i18n/messages/en.json`, `ru.json` |
| Contacts: Telegram, LinkedIn, GitHub | `src/lib/contacts.ts` (also the footer and JSON-LD `sameAs`) |
| The page: intro, five steps of work, contacts | `src/app/page.tsx` |
| Share card | `src/app/opengraph-image.tsx` (`meta.ogTitle`, `meta.ogTagline`) |
| JSON-LD | `WebSite` and `Person` in `src/app/layout.tsx` |

A new page: "Adding a page" in the starter's README, and its path in `src/app/sitemap.ts` and `e2e/a11y.spec.ts`.

## Accounts

The site signs in through the account site (`id.nick-lukashik.com`), as the previous platform's landing did. It is off until `ID_URL`, `ID_API_URL` and `SESSION_SECRET` are set: then the header shows "Sign in", or the person and "Sign out". Without them nothing changes and `/auth/*` answers 404. The whole design: `docs/identity.md` in the org repo, flow 4.

| Route | What |
|---|---|
| `GET /auth/sign-in?returnTo=` | Seals state, PKCE verifier and the return path into `__Host-site_sso` (10 minutes) and sends the browser to `id.nick-lukashik.com/authorize` |
| `GET /auth/callback` | Checks the state, exchanges the code at `id-api` (server to server) for this site's own session, back to the return path |
| `POST /auth/sign-out` | Ends this site's session at `id-api`; the session at the account site stays |
| `/auth/error` | A sign-in the person asked for did not work, and "Try again" |

- **The session.** `__Host-site_session`: tokens and the name to show, sealed with AES-256-GCM under `SESSION_SECRET`, `HttpOnly`, 30 days. The proxy refreshes it with less than 60 s left and asks `id-api` for the name again then.
- **Silent sign-in** (`src/lib/sso/silent.ts`). The account site keeps `nl_hint=1` on the parent domain while it is signed in. A page visit with the hint and no session here goes once through `/auth/sign-in?silent=1` (`prompt=none`: no page at the account site) and comes back signed in, or signed out without an error. Never for crawlers, prefetches or Lighthouse, at most once per 5 minutes; after "Sign out" here, not until the person signs in here again. A session that came this way ends when the hint goes.
- Pages stay the same for everyone except the header, which reads the cookie.

| Variable | What |
|---|---|
| `ID_URL` | Public origin of id-web, `https://id.nick-lukashik.com` |
| `ID_API_URL` | id-api inside the cluster, `http://id-api.prod.svc` |
| `SESSION_SECRET` | Key of this site's session cookie, 32+ characters, the same on every replica; its own, not id-web's |

## Getting started

```bash
pnpm install
pnpm env:local          # .env.local from .env.example
pnpm dev                # http://localhost:3000
pnpm verify && pnpm test:e2e
```

The e2e suite starts the site a third time with accounts on, against `e2e/mock-id.mjs` (the account site in memory).

## Deploy

- CI (`.github/workflows/ci.yml`): `build.yml@v1` with `kind: web` runs verify, e2e and the image; on `master` it pushes `ghcr.io/nick-lukashik/landing-web` and `deploy-pr.yml@v1` opens the PR in `gitops`. Merging that PR is the deploy.
- gitops: `apps/landing-web/prod` (`components/service`, `components/web`, `components/host`): the root domain, `SITE_URL` from the route, `ROBOTS=index`. Accounts need `ID_URL`, `ID_API_URL`, the SealedSecret with `SESSION_SECRET`, and egress to `id-api`.
- After the first image: make the package `landing-web` public in GHCR (**Package settings → Change visibility**), so the cluster pulls it without a secret.
- `.github/workflows/smoke.yml` runs the smoke check by hand; after a deploy the smoke check of `gitops` runs on its own.
