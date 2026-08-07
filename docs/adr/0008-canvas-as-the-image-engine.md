# 8. Use the browser's own canvas as the image engine

Date: 2026-08-07
Status: Accepted

## Context

Phase 2 is five client-side image tools: convert, compress, resize, crop and
rotate. All five are the same operation underneath — decode pixels, draw them
somewhere, encode them again — and none of them has a natural home in pdf-lib or
pdf.js.

The obvious alternatives were a WASM codec bundle (libvips, Squoosh's encoders,
sharp-wasm) or a per-format JavaScript encoder. Both add megabytes to a worker
that already carries a PDF library, and both need the same decode step the
browser performs anyway.

## Decision

Build the image tools on `createImageBitmap` + `OffscreenCanvas.convertToBlob`,
in `src/lib/image/`. No new dependency.

`raster.ts` holds the parts that need a canvas — decode, draw, encode, and a
support probe. `formats.ts` holds the format tables, which the UI and the tests
need and which must not drag a canvas in with them. Each tool keeps its own pure
logic file, with encoding injected, so the batching and naming stay testable in
node exactly as `pdf-to-jpg` already does it.

`pdf-to-jpg` is the precedent: it has been rasterising pages this way since
phase 1, inside a worker, including the white-flattening that JPEG needs.

## Consequences

- The encoder is whatever the browser ships. We do not choose the JPEG or WEBP
  implementation, and output bytes will differ slightly between browsers.
- AVIF is not universally writable. `convertToBlob` falls back to PNG rather
  than failing when it does not know a format, so support has to be probed by
  encoding a pixel and reading the blob's type back. The probe must create a
  rendering context first: a canvas that was never drawn on throws instead of
  encoding, which would report every format as unsupported.
- The probe result drives the UI, so an unavailable format is greyed out with a
  reason rather than failing at the end of a run. Silently returning a PNG that
  claims to be an AVIF is the one outcome this must never produce.
- EXIF orientation is handled once, at decode (`imageOrientation: 'from-image'`),
  so no tool has to think about sideways phone photos.
- Nothing here reads a file from disk twice or holds more than one decoded
  bitmap at a time; bitmaps are closed as soon as they are encoded.
- Revisit only for an operation the canvas genuinely cannot do — background
  removal needs a model, and vectorising needs a tracer. Neither is phase 2.
