# Manga Reader

A cross-platform, **local-only** manga reader built as an installable PWA
(Vite + React + TypeScript). Point it at a folder of manga and read — nothing is
ever uploaded to a server. Read-state and your reading position are stored in the
browser (localStorage).

## Features

- **Cross-platform navigation** — all funnel into the same next/prev actions:
  - **Swipe** left/right on touch devices (iOS/Android).
  - **Arrow keys** (← →), **Space**, **PageUp/PageDown** on desktop. **Esc** returns to the library.
  - **Tap/click zones** — left third = previous page, right third = next — plus on-screen Prev/Next buttons.
- **Local library** — select a folder; the app reads your series/chapters/pages from disk in-memory.
- **Read tracking** — a chapter is marked **read once you reach its last page**.
- **Visual indicators** — read chapters are greyed out with a ✓; series show a read/total count.
- **Resume** — read-state persists across sessions, and **Quick Resume** jumps back to your last chapter/page.

## Folder structure

The app expects a 3-level tree (select the **root** folder):

```
MangaRoot/
  One Piece/
    Chapter 001/
      001.jpg
      002.jpg
    Chapter 002/
      ...
  Berserk/
    Chapter 01/
      ...
```

Series, chapters, and pages are **natural-sorted** (so "Chapter 10" follows "Chapter 2").
Supported image types: jpg, jpeg, png, gif, webp, avif, bmp.

## Platform notes

Folder loading uses the universally-supported `<input webkitdirectory>` picker. On
desktop Chromium and Android Chrome this works directly. On **iOS** every browser
(including Chrome and Opera) runs on Apple's WebKit engine, so the newer File System
Access API and persistent folder handles aren't available — you re-select your folder
once per session, then read-state and resume restore immediately (keyed by relative path).

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## Deploy to Cloudflare (Workers static assets)

The app is fully static (all logic is client-side). It deploys as a Cloudflare
**Workers static-assets** site, configured by `wrangler.jsonc` in the repo root:

```jsonc
{
  "name": "manga-reader",
  "compatibility_date": "2026-05-31",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

`not_found_handling: "single-page-application"` makes Cloudflare serve `index.html`
for any route that doesn't match a built file — the SPA fallback (no `_redirects`
needed for Workers).

**Build settings:**

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build output directory: `dist`
- Node version: 20 (pinned via `.nvmrc`)

**Option A — Git integration (recommended):** In the Cloudflare dashboard,
create a Worker connected to the `alta01/manga-reader` repository. With
`wrangler.jsonc` present, the auto-detected `npx wrangler deploy` command uploads
`dist/` as static assets. Pushes to `main` auto-deploy.

**Option B — Wrangler CLI:**

```bash
npm run build
npx wrangler deploy
```

(Requires your own Cloudflare authentication via `wrangler login`.)
