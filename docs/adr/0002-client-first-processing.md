# 2. Process on the device by default

Date: 2026-08-07
Status: Accepted

## Context

Competitors upload everything. That is simpler to build and it is why they all
need a retention policy, a deletion promise, and a paragraph asking you to trust
them.

## Decision

Any operation the browser can perform, the browser performs. `processing:
'server'` requires justification: the operation needs a library with no viable
WASM build (Tesseract at quality, LibreOffice, the U²-Net model) or resources a
tab should not spend.

Client work runs in a Web Worker, one spawned per run and terminated when the
run ends.

## Consequences

- The privacy claim is structural, not a policy. A file that is never uploaded
  cannot be retained or leaked.
- No server cost for the majority of the catalog, and no queue.
- A worker per run costs a few milliseconds of startup and buys real
  cancellation: `terminate()` stops a synchronous WASM call, which cooperative
  polling cannot.
- Client tools are bounded by device memory. Manifests declare per-tool size
  limits so the constraint is visible in the UI before a file is chosen.
- Two implementations exist for some concepts (client compress, server compress).
  Accepted: the manifest makes which one is running explicit to the user.
