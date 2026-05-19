# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

Package manager is **pnpm**.

- `pnpm dev` — start dev server with Turbopack (localhost:3000)
- `pnpm build` — production build (`output: 'standalone'` in `next.config.ts`)
- `pnpm lint` — ESLint (`eslint ./src`)
- `pnpm format` / `pnpm format:check` — Prettier (`./src`)
- No test runner configured yet

## Big picture

"Vật Lí Thầy Năng" — a Vietnamese physics tutoring brand. Next.js 16 App Router (React 19), TypeScript, Tailwind v4. The app has three surfaces:

1. **Public landing** (`/`) — marketing site composed from `src/components/features/home/*`.
2. **Auth flows** (`/auth/login`, `/auth/activation`, `/auth/change-password`) — session bootstrap via server actions.
3. **Authenticated app** — `/admin/*` (ADMIN only) and `/dashboard/*` (STUDENT only), each with its own sidebar shell.

Path alias `@/*` → `src/*`.

## Auth & route protection

Sessions are **opaque cookie → Redis lookup**, not JWT. The flow:

- Cookie: `session_id` (httpOnly, sameSite=lax, 30d). Set/cleared via helpers in `src/lib/server/cookies.ts`.
- Stored at Redis key `session:<id>` as `SessionInfo = { userId, email, role, fullName?, hasPassword }` (see `src/types/auth.ts`).
- `readSessionFromRedis` in `src/lib/redis/index.ts` is the single read path; `getCurrentSession()` in `src/lib/server/session.ts` is the server-component helper.

Route protection happens in **two layers** — keep them in sync:

- `src/proxy.ts` is the edge gate (Next.js 16 renamed `middleware.ts` → `proxy.ts`; `matcher` is exported alongside `proxy`). It redirects unauth users to `/auth/login`, redirects already-authed users away from `/auth/login`, and enforces `/admin/*` is ADMIN-only.
- Each protected layout (`src/app/admin/layout.tsx`, `src/app/dashboard/layout.tsx`) re-checks the session server-side and additionally redirects to `/auth/change-password` when `session.hasPassword === false`. This `hasPassword` gate runs in layouts, **not** in the proxy.

Role homes: ADMIN → `/admin/users`, STUDENT → `/dashboard`. When changing redirects, update both layers.

Redis also stores: `activation:<token>` (one-time activation payloads, read by `readActivationFromRedis`) and `ratelimit:login:<ip>:<email>` (5 attempts / 15 min, fail-open on Redis errors — see `checkLoginRateLimit`).

## Server actions

All write paths are server actions under `src/actions/v1/<domain>/<verb>.ts` (`'use server'`). They follow a consistent return shape:

```ts
{ success: boolean; errors: string[]; redirectTo?: string }   // auth-style
{ errors: string[] }                                          // simpler IActionState
```

- Errors from the backend are normalized via `extractErrors()` in `src/lib/errors.ts` (backend returns `{ errors: string[] | string }`).
- Clients dispatch results through `handleActionResult(errors, onSuccess?, successMessage?)` in `src/lib/actions.ts`, which toasts via `sonner`. Use this rather than re-implementing the success/error toast dance.
- Mutating actions that affect server-rendered pages call `revalidatePath('/admin/...' | '/dashboard/...')` before returning.

## HTTP layer (two axios instances)

`src/lib/axios/index.ts` exports **two** clients — pick deliberately:

- `api` — for any action that needs the logged-in user. Request interceptor reads `session_id` from cookies and injects it as `X-Session-Id` for the backend; also forwards a sanitized `X-Frontend-Path` header (with `tk`/`token`/`session_id` query params redacted) on POST/PUT/PATCH/DELETE.
- `apiClient` — unauthenticated, used at login and other pre-session endpoints.

Base URL: `NEXT_PUBLIC_API_URL` (falls back to `NEXT_PUBLIC_API_ENDPOINT`, then `http://localhost:5432`). `src/lib/axios/server.ts` just re-exports for legacy import paths.

## Data layer (no DB)

This app has no direct DB. Data flows: **server action → axios `api` → external backend**. The only stateful store this codebase owns is Redis (sessions / activation tokens / rate limits).

For static landing-page content (courses, achievements, menu items, teacher bio, asset paths), all of it lives in `src/constants/*.ts` as typed const arrays — components iterate via `.map()`. Don't hardcode repeated landing-page content in JSX.

Shared enum-style options (`GENDER_OPTIONS`, `ROLE_OPTIONS`, `STATUS_OPTIONS`, `PAGE_SIZE_OPTIONS`, `ALL_VALUE`) and validation regex/messages (`EMAIL_REGEX`, `PASSWORD_REGEX`, `VN_PHONE_REGEX`, `VALIDATION_MESSAGES`) live in `src/lib/constants.ts` and `src/lib/validation.ts` — reuse them rather than redefining.

## Styling

Tailwind CSS v4, **no `tailwind.config.ts`** — Tailwind is wired through `postcss.config.mjs` (`@tailwindcss/postcss`) and configured via `@theme` blocks in `src/styles/globals.css`. Custom brand tokens (`--color-purple`, `--color-pink`, `--color-gold`, `--color-light-bg`, `--color-course-bg`, etc.) and font CSS variables are defined there. Arbitrary values (`text-[2.8rem]`, `shadow-[...]`) are used freely on the landing page.

Fonts loaded in `src/app/layout.tsx` via `next/font/google`, each with `vietnamese` subset:

- `--font-paytone` (Paytone One) — landing headings
- `--font-cabin` — landing body (default `<body>` font)
- `--font-opensans` — authenticated app shells (`/admin`, `/dashboard` set `font-opensans` on their wrapper)

shadcn/ui (`components.json`, style **new-york**, base color **slate**, lucide icons) is the source for `src/components/ui/*`. Don't duplicate primitives — extend the existing ones.

## Component organization

- `src/components/features/<domain>/` — feature components (`home`, `auth`, `profile`, `users`). All client components (`'use client'`), one per file, `export default`. Landing components use `motion/react` with scroll-triggered `whileInView` + `viewport={{ once: true }}` patterns.
- `src/components/app/` — authenticated app shell (`AppSidebar`, `AppTopbar`). `AppSidebar` exports the `ADMIN_NAV` / `DASHBOARD_NAV` arrays consumed by the two layouts.
- `src/components/ui/` — shadcn primitives.
- `src/components/ui/custom/` — small shared form primitives (`ActionButton`, `FormTextField`, `PasswordFields`) used across auth and profile forms. Prefer these over hand-rolled inputs in feature components.

## Misc

- Toasts: `sonner`, mounted in root layout. Top loader: `nextjs-toploader` (purple `#723bcf`).
- `src/lib/utils.ts` → `cn()` (clsx + tailwind-merge).
- `src/lib/bunny_net/` — Bunny.net storage SDK wrapper (uploads).
- Assets: `src/constants/assets.ts` (`ASSETS` const). Some files in `public/assets/` have Vietnamese-named originals plus ASCII-safe copies (e.g. `anh-ao-den.png`); prefer ASCII paths.
- `next.config.ts` sets `Referrer-Policy: no-referrer` on `/auth/activation` so activation tokens in URLs don't leak via Referer.

## Environment variables

See `.env.example`:

- `NEXT_PUBLIC_API_URL` — backend base URL
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` / `REDIS_TLS_CERTIFICATE` — Redis (TLS required outside development; dev uses db 0, prod uses db 1)
- `BUNNY_STORAGE_API_KEY` / `BUNNY_STORAGE_ZONE_NAME` / `BUNNY_STORAGE_ZONE_REGION`

## Deploy

Vercel, auto-deploys `main` to `vatli-thay-nang.vercel.app`. Build uses `output: 'standalone'`.

### Vercel best practices

- Treat Vercel Functions as stateless + ephemeral; use Blob or marketplace integrations for preserving state
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add`
- Sync env + project settings with `vercel env pull` / `vercel pull`
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; use Edge Config for small, globally-read config
- Enable Web Analytics + Speed Insights early
