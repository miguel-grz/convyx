# 3. Split the web app into three TypeScript projects

Date: 2026-08-07
Status: Accepted

## Context

`lib.dom` and `lib.webworker` declare conflicting globals and cannot coexist in
one program — TypeScript reports hundreds of duplicate-identifier errors. The
app has DOM code, worker code, and Node code (`vite.config.ts`) in one package.

## Decision

Three projects instead of one:

- `tsconfig.app.json` — `src`, DOM libs, excludes `**/worker.ts`
- `tsconfig.worker.json` — worker entrypoints only, WebWorker libs
- `tsconfig.node.json` — `vite.config.ts` and `eslint.config.js`, Node types

`pnpm typecheck` runs all three. `tsconfig.json` references them for editors.

## Consequences

- Worker code is typed against the scope it actually runs in, so `self.postMessage`
  with a transfer list typechecks correctly instead of needing a cast.
- Adding a worker means adding a file matching `**/worker.ts` — the convention
  the registry already uses, so no config change.
- Three `tsc` invocations instead of one. Negligible at this size.
