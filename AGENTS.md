<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# landing-web: rules for agents

The site on nick-lukashik.com, made from `next-starter`: one page, EN/RU, stock shadcn/ui. Stack: Next.js 16.4 (App Router, `output: 'standalone'`, React Compiler, typed routes), React 19.3, TypeScript 7 (strict), Node 26, pnpm 12, next-intl 4 (EN/RU, no locale in the URL), Zod 4, Tailwind 4, shadcn/ui (Radix), Pino, Biome, Vitest 5, Playwright 1.64 + axe. No backend.

## Library rules

Read a library's file before working with it. The first line of each file names its source.

| File | Library |
|---|---|
| [.claude/rules/nextjs.md](.claude/rules/nextjs.md) | Next.js: docs in `node_modules/next/dist/docs/`, proxy, CSP, metadata |
| [.claude/rules/react.md](.claude/rules/react.md) | React 19 and React Compiler |
| [.claude/rules/next-intl.md](.claude/rules/next-intl.md) | next-intl without i18n routing |
| [.claude/rules/zod.md](.claude/rules/zod.md) | Zod 4: env, validation at boundaries |
| [.claude/rules/tailwindcss.md](.claude/rules/tailwindcss.md) | Tailwind 4: tokens, one light theme |
| [.claude/rules/shadcn.md](.claude/rules/shadcn.md) | shadcn/ui: CLI, components, CSP |
| [.claude/rules/vitest.md](.claude/rules/vitest.md) | unit tests |
| [.claude/rules/playwright.md](.claude/rules/playwright.md) | e2e and axe |
| [.claude/rules/biome.md](.claude/rules/biome.md) | linter and formatter |

## Where things are

- `src/proxy.ts`: every request but `/api/*` (reserved for the API proxy, see next-example) gets a request id and `x-app-version`; pages also get the nonce CSP, the locale (`?lang=` > cookie > English) and `x-pathname` for metadata.
- `src/app/`: routes. `layout.tsx` holds shared metadata and JSON-LD (`WebSite`, `Person`); `page.tsx` is the site; `health/live` and `health/ready` are the probes.
- `src/lib/contacts.ts`: the owner's public profiles (page, footer, JSON-LD).
- `src/lib/env/`: env through Zod, `server.ts` (server only, read at startup). No `NEXT_PUBLIC_*`: one image runs on stage and prod, so nothing environment-specific is inlined at build time (`ROBOTS` is runtime env too).
- `src/lib/security/`: CSP and static headers. `src/lib/seo/`: alternates, robots, Open Graph.
- `src/i18n/`: locales, locale resolution, next-intl config, catalogs `messages/{en,ru}.json`.
- `src/components/ui/`: shadcn/ui components (source, owned here). `src/components/`: header, footer, language switch.
- `e2e/`: Playwright; `servers.ts` holds the test servers' ports.

## Conventions

- A backend is added only when a page needs its data, by copying the API capability from `next-example` with its tests; never a stub "for later". Its rules (`/api` on the same origin only, the header allow-list, `docs/auth.md`) come with it.
- A page exports only `title` and `description` through `generateMetadata` + `getTranslations`; the root layout sets canonical, hreflang and `og:url`.
- All text lives in `src/i18n/messages/en.json` and `ru.json` with the same keys (a unit test checks it). Write Russian copy by hand, not machine-translated.
- UI comes from shadcn/ui (`pnpm exec shadcn add <name>`), see `.claude/rules/shadcn.md`. One light theme: colours are tokens from `src/app/globals.css`, no `dark:` classes (a unit test checks it), AA contrast. No server-rendered `style={...}`: the CSP blocks inline styles.
- Server modules start with `import 'server-only'`. Read `process.env` only in `src/lib/env/` (plus `APP_VERSION`/`NODE_ENV` in the proxy and instrumentation).
- English everywhere (code, comments, docs, tests) except the product copy in `ru.json`. Comments are short and to the point.
- Code style is Biome's (`biome.json`): 4-space indent, single quotes (double in JSX), no semicolons, trailing commas, `type` over `interface`, inline `type` imports, `T[]` arrays, kebab-case file names. Run `pnpm format`.
- Dependencies are pinned to exact versions (`savePrefix: ""`); Renovate updates them (`renovate.json`).
- No secrets, real IPs or emails in files: only `example.com`.

## Check before handing over

```bash
pnpm verify      # biome + next typegen && tsc + vitest + next build
pnpm test:e2e    # Playwright against the standalone build
```

Report the commands and their actual result.
