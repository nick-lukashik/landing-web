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

## Getting started

```bash
pnpm install
pnpm env:local          # .env.local from .env.example
pnpm dev                # http://localhost:3000
pnpm verify && pnpm test:e2e
```

## Deploy

- CI (`.github/workflows/ci.yml`): `build.yml@v1` with `kind: web` runs verify, e2e and the image; on `master` it pushes `ghcr.io/nick-lukashik/landing-web` and `deploy-pr.yml@v1` opens the PR in `gitops`. Merging that PR is the deploy.
- gitops: `apps/landing-web/prod` (`components/service`, `components/web`, `components/host`): the root domain, `SITE_URL` from the route, `ROBOTS=index`.
- After the first image: make the package `landing-web` public in GHCR (**Package settings → Change visibility**), so the cluster pulls it without a secret.
- `.github/workflows/smoke.yml` runs the smoke check by hand; after a deploy the smoke check of `gitops` runs on its own.
