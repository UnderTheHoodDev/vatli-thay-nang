# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

Package manager is **pnpm**.

- `pnpm dev` — start dev server with Turbopack (localhost:3000)
- `pnpm build` — production build
- `pnpm lint` — ESLint (`eslint ./src`)
- `pnpm format` — Prettier write (`./src`)
- `pnpm format:check` — Prettier check
- No test runner configured yet

## Architecture

Landing page for "Vật Lí Thầy Năng" — a Vietnamese physics tutoring brand. Next.js 16 App Router, single page (`src/app/page.tsx`), no API routes, no database.

**Styling:** Tailwind CSS v4. Custom color tokens and font variables are defined via `@theme` in `src/styles/globals.css`. A minimal `tailwind.config.ts` exists only to register the `tailwindcss-animate` plugin. Arbitrary values (`text-[2.8rem]`, `shadow-[...]`) are used extensively. shadcn/ui is configured via `components.json` (style: new-york).

**Fonts:** Paytone One (headings) + Cabin (body), loaded via `next/font/google` in `layout.tsx` as CSS variables `--font-paytone` / `--font-cabin`. Both include `vietnamese` subset.

**Data layer:** All display content (courses, achievements, menu items, asset paths) lives in `src/constants/*.ts` as typed const arrays. Components render via `.map()` — never hardcode repeated content in JSX.

**Asset paths:** Centralized in `src/constants/assets.ts` as `ASSETS` const. All components import from there. Images in `public/assets/` include some Vietnamese-named files (Unicode combining chars) with ASCII-safe copies (e.g., `anh-ao-den.png`).

**Components:** All in `src/components/features/home/`, one per file, `export default`. All are client components (`"use client"`). Animations use `motion` from `motion/react` with scroll-triggered `whileInView` + `viewport={{ once: true }}` patterns throughout.

**Utilities:** `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge). React Query client in `src/lib/react-query/` (staleTime: 60s, gcTime: 24h). Axios instance in `src/lib/axios/` (base URL from `NEXT_PUBLIC_API_URL`). Bunny.net storage SDK in `src/lib/bunny_net/`. The contact form UI exists but does not currently submit to any API.

## Deploy

Vercel, connected to GitHub repo. Pushes to `main` auto-deploy to production at `vatli-thay-nang.vercel.app`. `next.config.ts` uses `output: 'standalone'`.

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

- Treat Vercel Functions as stateless + ephemeral; use Blob or marketplace integrations for preserving state
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add`
- Sync env + project settings with `vercel env pull` / `vercel pull`
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- Enable Web Analytics + Speed Insights early
<!-- VERCEL BEST PRACTICES END -->
