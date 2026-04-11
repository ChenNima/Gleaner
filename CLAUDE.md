# Gleaner

GitHub-based read-only knowledge base (Obsidian-like). Pure SPA, no backend.

## Tech Stack

- **Framework**: Vite + React 19 + TypeScript 6
- **State**: Zustand (`src/stores/`)
- **DB**: IndexedDB via Dexie.js (`src/db/index.ts`) — tables: config, repos, files, links
- **Styling**: Tailwind CSS 4 + shadcn/ui conventions + `@tailwindcss/typography`
- **Markdown**: unified pipeline (remark-parse → remark-gfm → remark-rehype → rehype-highlight → rehype-stringify)
- **Graph**: react-force-graph-2d
- **Package manager**: pnpm
- **Testing**: Playwright (E2E)

## Commands

```bash
pnpm install          # install deps
pnpm run dev          # dev server with HMR (localhost:5173)
pnpm run build        # type-check + production build (tsc -b && vite build)
pnpm run lint         # eslint check
npx playwright test   # E2E tests (needs dev server running)
```

## Pre-commit Checklist

Before committing, ensure both checks pass with zero errors:

1. `pnpm run build` — TypeScript type-check + Vite production build
2. `pnpm run lint` — ESLint (must have 0 errors; warnings are acceptable)

## Project Structure

```
src/
  db/index.ts          # Dexie schema & TypeScript interfaces
  lib/
    github.ts          # GitHub REST API client (Trees, Contents)
    auth.ts            # PAT storage (IndexedDB)
    config.ts          # gleaner.yaml fetch & parse
    sync.ts            # Background sync engine (incremental, rate-limit retry)
    wikilink-parser.ts # Wikilink + standard markdown link parsing & resolution
    errors.ts          # Custom error hierarchy
  stores/
    app.ts             # Zustand: repos, fileTree, currentFileId, sidebar state
    theme.ts           # Zustand: light/dark toggle
  components/
    Layout.tsx         # Three-column Obsidian layout (sidebars + main)
    FileTree.tsx       # Left sidebar file tree
    BacklinksPanel.tsx # Right sidebar backlinks
    MarkdownViewer.tsx # Markdown renderer with wikilink click handling
  pages/
    HomePage.tsx       # Auto-sync on mount, redirect to /settings if unconfigured
    FilePage.tsx       # File viewer with wikilink resolution
    GraphPage.tsx      # Force-directed knowledge graph
    SettingsPage.tsx   # Config repo, PAT, cache controls
```

## Key Patterns

- **Config-driven**: repos are defined in `gleaner.yaml` in a config repo on GitHub
- **Incremental sync**: compares tree SHA to skip unchanged repos
- **Background caching**: fetches file tree first (fast), then content in background with progress
- **Rate limit recovery**: retry loop with wait on 403/429, doesn't skip files
- **Link types**: supports both `[[wikilinks]]` and standard `[text](path.md)` links
- **Cross-repo resolution**: wikilinks resolve globally, same-repo priority for duplicates

## TypeScript Notes

- `erasableSyntaxOnly` is enabled — no parameter properties in constructors (use field declarations)
- No `baseUrl`/`paths` in tsconfig — use relative imports only

## Auth

- PAT (Personal Access Token) is optional — stored in IndexedDB
- Without PAT: 60 req/hr GitHub API limit
- With PAT: 5000 req/hr
