# Convyx

File tools that finish the job on your device.

Merge, split, convert and compress PDFs and images. Most tools never upload
anything — the file is read, transformed and written back inside your browser.
The ones that genuinely need a server delete the file within the hour.

> **Status:** phases 0 and 1 complete. Seven PDF tools work end to end, all of
> them entirely in the browser. The remaining 19 are in the catalogue as
> `planned` and ship in phases 2–5. See [the roadmap](#roadmap).

## Why this exists

Every tool site in this category works the same way: upload your file, trust the
policy, download the result. Convyx is built the other way round — the browser
does the work, so there is nothing to trust. The
[privacy page](apps/web/src/pages/PrivacyPage.tsx) is generated from the tool
manifests, which means it cannot claim something the code does not do.

## The part worth reading

Adding a tool to Convyx is **one folder and no edits anywhere else**:

```
apps/web/src/tools/pdf-merge/
  manifest.ts   what it is        → route, catalog card, search entry, nav slot
  merge.ts      what it does      → pure function, no DOM, fully tested
  worker.ts     where it runs     → three-line thread shell
  Tool.tsx      what it looks like
  handler.ts    the glue
```

No router entry. No navigation array. No catalog page. `registry.ts` discovers
tools from the filesystem, validates them at import time, and every surface in
the app is derived from what it finds.

That is the whole idea, and it is documented in
[docs/architecture.md](docs/architecture.md) and
[docs/adding-a-tool.md](docs/adding-a-tool.md).

## Design

Deliberately conventional, carefully finished. Structure follows the tools people
already know — a searchable grid, category-coloured icons, obvious buttons — and
the finish is where the effort goes. The full system is in
[DESIGN.md](DESIGN.md), and the reasoning is in
[ADR 0006](docs/adr/0006-follow-category-convention.md).

Every count on every page is generated from the tool manifests, so the marketing
copy cannot claim something the catalog does not contain.

## Running it

```bash
pnpm install
pnpm dev
```

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Vite dev server on :5173           |
| `pnpm test`      | Registry invariants and tool logic |
| `pnpm typecheck` | App, worker and node projects      |
| `pnpm lint`      | ESLint                             |
| `pnpm build`     | Typecheck then production build    |

Developer docs: [architecture](docs/architecture.md) · [adding a tool](docs/adding-a-tool.md) · [design system](DESIGN.md) · [decisions](docs/adr/)

## Layout

```
apps/
  web/                React 19 · Vite · TypeScript · Tailwind v4
  api/                FastAPI (phase 3)
packages/
  tool-contract/      ToolManifest, ToolHandler, JobStatus, ToolError
  config/             shared tsconfig
infra/                docker compose, nginx (phase 9)
docs/
  architecture.md     the Tool Registry
  adding-a-tool.md    step by step
  adr/                dated technical decisions
```

## Roadmap

| Phase | Scope                                                              | Status |
| ----- | ------------------------------------------------------------------ | ------ |
| 0     | Registry, contract, shell, design system, shared upload/run/result | Done   |
| 1     | Client PDF tools — split, rotate, organize, extract, PDF↔JPG       | Done   |
| 2     | Client image tools — convert, compress, resize, crop, rotate       | Next   |
| 3     | FastAPI, temporary storage with enforced TTL, async job queue      |        |
| 4     | Server PDF tools — OCR, Office conversion, Ghostscript, passwords  |        |
| 5     | Server image tools — vectorize, remove background                  |        |
| 6     | UI/UX pass — previews, progress detail, motion, responsive polish  |        |
| 7     | Security — rate limits, mime sniffing, guaranteed deletion         |        |
| 8     | Optional accounts                                                  |        |
| 9     | Docker, CI/CD, logging, privacy-respecting analytics, SEO          |        |
| 10    | Launch — screenshots, live demo, architecture write-up             |        |

## Licence

MIT.
