# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm run dev` — start dev server (localhost:3000)
- `npm run build` — production build (also runs TypeScript checks)
- `npm run lint` — ESLint
- No test runner configured yet

## Architecture

Static marketing site for "Vật Lí Thầy Năng" — a Vietnamese physics tutoring brand. Next.js 16 App Router, single page, no API routes, no database.

**Styling:** Tailwind CSS v4 with `@theme` directive in `globals.css` for custom colors/fonts. No tailwind.config file — config lives in CSS. Arbitrary values (`text-[2.8rem]`, `shadow-[...]`) are used extensively to match a pixel-exact Figma design.

**Fonts:** Paytone One (headings) + Cabin (body), loaded via `next/font/google` in `layout.tsx` as CSS variables `--font-paytone` / `--font-cabin`.

**Data layer:** All display content (courses, achievements, menu items, asset paths) lives in `src/data/*.ts` as typed const arrays. Components render via `.map()` — never hardcode repeated content in JSX.

**Asset paths:** Centralized in `src/data/assets.ts` as `ASSETS` const. All components import from there. Images in `public/assets/` include some Vietnamese-named files (Unicode combining chars) with ASCII-safe copies (e.g., `anh-ao-den.png`).

**Components:** All in `src/components/`, one per file, `export default`. Only `Header.tsx` is a client component (`"use client"`) for the mobile hamburger toggle. Everything else is server-rendered.

## Deploy

Vercel, connected to GitHub repo. Pushes to `main` auto-deploy to production at `vatli-thay-nang.vercel.app`.

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
