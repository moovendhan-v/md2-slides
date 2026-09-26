# Slidewise

Markdown slide decks synced to GitHub. One `.md` file = one deck. Write Markdown, restyle any block
visually, present with a full presenter view, and push changes as commits.

Built with **Next.js (App Router)**, **shadcn/ui**, **Zustand**, **TanStack Query + Table**, and a
**Rust core compiled to WebAssembly** that runs in the browser and in Vercel Functions.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The compiled engine (`public/wasm/slide_engine_bg.wasm` + `src/engine/wasm/pkg/`) is committed, so
no Rust toolchain is needed to run or deploy. To change the engine:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.100
npm run wasm:build   # rebuilds the .wasm and JS bindings
```

| Script | What it does |
| --- | --- |
| `npm run typecheck` / `lint` | TypeScript + ESLint |
| `npm test` | Vitest unit tests for the source-editing domain layer |
| `npm run test:engine` | Rust unit tests for the parser, template store and slot renderer |
| `npm run build` | Production build |

Optional environment variables:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables real AI deck generation in `/api/ai`. Without it the dialog falls back to the closest ready-made deck. |
| `SLIDEWISE_AI_MODEL` | Override the model (default `claude-opus-5`). Requests enable server-side refusal fallbacks. |
| `NEXT_PUBLIC_TEMPLATE_SOURCE=remote` | Read/write templates through the Wasm-backed `/api/templates` function instead of the in-browser store. |

## Features

- **GitHub sign-in & consent** flow, repository browser with per-file dirty state, commit dialog with line diffs (push or open a PR).
- **Editor**: colour-coded Markdown, `/` block inserter with live previews, ⌘K palette, problems panel, format, `.md`/PDF export.
- **Live preview** (all slides or focus mode) — click any block to restyle it, transform it into another block type, or edit images.
- **Customizer**: 4 palettes × dark/light, accents, 6 backgrounds, 5 font pairings, glass, radius, density, aspect ratio, per-slide layouts / colours / padding, 21 transitions and 8 block animations.
- **Templates**: decks, single slides and community templates — searched and paged inside the Wasm store; save any deck as a template.
- **Template studio**: author HTML + Tailwind layouts with `{{slots}}`, live preview, validation, and publish as `<!-- layout: custom:id -->`.
- **Presenter**: timer + limit, notes, next slide, pen, laser, blackout, zoom, overview, click-to-reveal, code step-through, share link settings.
- **AI**: generate a deck from a prompt using `public/llms-full.txt` as the model's syntax spec; output is validated by the Wasm parser.

The full Markdown syntax is in [`public/llms-full.txt`](public/llms-full.txt).

## Architecture

```
crates/slide-engine/        Rust → Wasm: parser, TemplateStore (search, paging, SWT1 snapshots), mustache slots
src/
  engine/                   Typed facade over the Wasm bindings (browser loader, server loader, React provider)
  domain/                   Pure TS: look/theme tokens, slide layout maths, source transforms, file tree
  data/                     Seed JSON (demo repos, templates, snippets, AI presets, code layouts)
  services/                 Interfaces + implementations: GitProvider, TemplateRepository, AiDeckService
  stores/                   Zustand slices: workspace, ui, editor, present, session, ai, studio, layouts
  hooks/                    TanStack Query hooks, deck/file actions, global shortcuts
  components/slide/         SlideView + block registry (one component per block family)
  components/shell/         Header, sidebar, file tree
  features/                 One folder per screen: auth, repo, editor, customize, templates, studio, present, ai, commit, palette, profile
  app/api/                  Vercel Functions running the same Wasm: /api/templates, /api/parse, /api/ai
```

**Why WebAssembly.** Parsing runs on every keystroke and template search runs on every filter change,
so both live in Rust. The browser loads the 260 KB module once and parses decks with no network
round-trip. API routes load the same binary as described in
[Vercel's Wasm guide](https://vercel.com/docs/functions/runtimes/wasm), so CI, bots and the app all
use the same parser. Templates are stored in the Wasm `TemplateStore`. In the browser it is persisted
to IndexedDB as a compact `SWT1` binary snapshot. On the server it lives per function instance. To
make it durable, save `store.snapshot()` bytes to Vercel Blob or KV in `src/server/template-store.ts`.

**Design principles.**
- *Single responsibility:* parsing (Rust), look tokens, layout maths, source edits and rendering each live in their own module.
- *Open/closed:* new block types register in `components/slide/blocks/registry.ts`. Screens and customizer tabs are registries too.
- *Dependency inversion:* UI depends on the `GitProvider`, `TemplateRepository` and `AiDeckService` interfaces. `app-shell/services.tsx` is the only place concrete classes are chosen.
- *DRY:* every document edit is a pure function in `domain/source`, shared by the toolbar, palette, preview and customizer through `useDeckActions`.

### What is demo vs real

- GitHub access uses `DemoGitProvider` (seed repos in `src/data/repos.json`). Implement `GitProvider` against the GitHub REST API and register it in `app-shell/services.tsx` to go live.
- Share links and viewer counts are UI-only.
