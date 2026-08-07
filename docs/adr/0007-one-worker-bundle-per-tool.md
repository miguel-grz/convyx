# 7. Accept a pdf-lib copy in every tool worker

Date: 2026-08-07
Status: Accepted

## Context

Vite compiles each `new Worker(new URL('./worker.ts', import.meta.url))` as its
own Rollup entry. Workers do not share chunks with each other or with the app,
so every PDF tool's worker carries its own copy of pdf-lib: seven workers at
~174 kB gzipped each, most of which is the same library.

`manualChunks` does not reach worker graphs, so there is no configuration that
fixes this.

## Decision

Accept the duplication for now.

None of it lands in the entry bundle (122 kB gzipped, verified free of pdf-lib
and pdf.js). A worker is fetched only when a run starts, so the cost is paid by
someone who has already chosen a tool and dropped a file in — and it is paid
once per tool, then cached.

The alternative is one shared worker taking a discriminated union of jobs. That
would collapse seven copies into one, and it would also mean every tool's logic
sharing a bundle: opening Merge PDF would download the pdf.js rasteriser it
never uses. It also breaks the rule that a tool is a self-contained folder,
which is the property the whole codebase is organised around.

## Consequences

- First interaction with a tool downloads ~174 kB gzipped. Using three tools in
  one session downloads pdf-lib three times.
- The entry bundle stays small and free of file-processing code.
- Revisit if the catalogue grows tools that share a heavy dependency _and_
  people routinely chain several in one visit. The measurement to beat is in
  this file; take a new one before changing anything.
- pdf.js is confined to `pdf-to-jpg`'s worker (131 kB gzipped) and is not
  reachable from anywhere else.
