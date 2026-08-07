# Architecture

Convyx is a catalog of file tools. The catalog is expected to grow from 26 tools
to a few hundred, across categories that do not exist yet. Every architectural
decision here follows from that one fact.

## The Tool Registry

A tool is a folder. Nothing else in the codebase knows it exists.

```
apps/web/src/tools/
  registry.ts          discovers everything below it
  pdf-merge/
    manifest.ts        what the tool is        (data)
    Tool.tsx           what the tool looks like (UI)
    merge.ts           what the tool does      (pure logic)
    worker.ts          where it runs           (thread shell)
    merge.test.ts
  image-compress/
    ...
```

`registry.ts` discovers tools with Vite's `import.meta.glob`:

```ts
const manifestModules = import.meta.glob('./*/manifest.ts', { eager: true });
const componentLoaders = import.meta.glob('./*/Tool.tsx');
```

Manifests are eager — they are small data objects and the catalog, search index,
navigation and route resolution all need them immediately. Components are lazy,
so a tool's dependencies (pdf-lib, a WASM binary, an image codec) load only when
someone opens that tool.

Everything user-facing is derived from that array:

| Surface            | Derived from                                     |
| ------------------ | ------------------------------------------------ |
| `/tools/:toolId`   | `getTool(id)` — one route serves every tool       |
| Category nav       | `getActiveCategories()` — categories with tools   |
| Catalog and search | `searchTools(query)` over name, keywords, summary |
| Landing hero       | `getFeaturedTools(1)` — the hero is a real tool   |
| Privacy page       | `tools.filter(t => t.processing === 'client')`    |

The privacy page is the clearest example of why this matters: it lists which
tools upload your file and which do not, generated from the manifests. The page
cannot claim something the code does not do.

### Invariants

The registry validates at import time and throws rather than degrading:

- a manifest's `id` must equal its folder name (the id is the URL)
- ids must be unique
- a tool marked `available` must have a `Tool.tsx`
- a tool marked `processing: 'server'` must declare an `endpoint`

Because the registry is imported by the app entry, a violation fails the
production build — see the `Build` step in CI.

## The contract

`packages/tool-contract` holds the types both halves of the product speak:
`ToolManifest`, `ToolHandler`, `JobStatus`, and the closed `ToolErrorCode` set.
It is a dependency of the web app today and of the API from phase 3, so a tool's
description cannot drift between client and server.

`ToolErrorCode` being a closed union is deliberate. Every failure the product can
have is enumerated, which is how the UI guarantees a specific message instead of
"something went wrong".

## Where work happens

Anything the browser can do, the browser does. This is a product promise, not an
optimisation: a file that is never uploaded cannot be retained, logged or
leaked, which is the difference Convyx is built around.

```
manifest.processing === 'client'   handler runs in a Web Worker on the device
manifest.processing === 'server'   handler posts to manifest.endpoint, polls a job
```

A tool moves to the server only when the operation genuinely cannot be done well
in WASM — OCR, Office conversion via LibreOffice, the background-removal model.

### Client-side tools

Heavy work runs in a worker, one per run:

```
Tool.tsx  --useToolRun-->  handler.ts  --runInWorker-->  worker.ts  -->  merge.ts
 (UI)        (lifecycle)     (glue)        (thread)        (shell)      (logic)
```

`runInWorker` spawns a dedicated worker and terminates it when the run ends.
A worker per run costs a few milliseconds and buys real cancellation: aborting
terminates the thread even if it is deep inside a synchronous WASM call, which
cooperative polling cannot do.

The logic lives in a plain module (`merge.ts`), not in `worker.ts`. That split is
what makes tools testable — the suite calls the logic directly on real PDFs, with
no worker in sight.

## Adding a tool

See [adding-a-tool.md](./adding-a-tool.md). The short version: create a folder,
write a manifest, write the logic, write the UI. Do not touch the router, the
navigation, the catalog or the search index.

## Layout

```
apps/
  web/                React + Vite + TypeScript
  api/                FastAPI (phase 3)
packages/
  tool-contract/      types shared by web and api
  config/             shared tsconfig
infra/                docker compose, nginx (phase 9)
docs/adr/             dated technical decisions
```
