# 10. Decode JPEG 2000 and JBIG2, and widen the policy to allow it

Date: 2026-08-07
Status: Accepted

## Context

Two image formats a PDF may contain have no decoder in any browser: JPEG 2000,
which print and archival exporters emit, and JBIG2, which is what most scanners
produce for black-and-white pages. pdf.js carries decoders for both, compiled to
WebAssembly and fetched at render time, along with a colour engine for ICC-based
and CMYK colour.

None of them were served. The build copied `standard_fonts` and `cmaps` out of
pdfjs-dist and stopped there, so a scanned document converted through PDF to JPG
came out as a blank rectangle with the text and rules around it perfectly
intact — the same shape of failure as the missing fonts before it, and just as
easy to look straight past.

Serving the files is not enough on its own. Chrome refuses
`WebAssembly.instantiate` unless `script-src` names `'wasm-unsafe-eval'`, and
ADR 9 asks that any widening of that policy be argued here first.

## Decision

Copy pdfjs-dist's `wasm` and `iccs` directories alongside the fonts and CMaps,
point `getDocument` at them, and add `'wasm-unsafe-eval'` to `script-src`.

The argument for widening, in the order it convinced us:

- **It is not the promise.** What a visitor is asked to believe is that the file
  stays on the device, and what enforces it is `connect-src 'self'` against an
  origin with no endpoint to receive anything. WebAssembly has no I/O of its
  own; it cannot open a socket, and it reaches the network only through the
  same-origin JavaScript that was already allowed to. The claim in the copy and
  the line in the policy that backs it are both untouched.
- **`script-src` was never the guarantee it looks like.** `'self'` already
  permits pdf.js to `import()` its plain-JavaScript fallback decoders from our
  own origin — about 600 KB of it, running as ordinary script. The choice was
  never between WebAssembly and no dynamic code; it was between WebAssembly in a
  sandbox with no ambient authority and the same algorithms as script with all
  of it. Refusing the narrower of the two would have been a policy that reads
  stricter than it behaves.
- **`'wasm-unsafe-eval'` is the small grant, not the large one.** It permits
  compiling WebAssembly and nothing else. The usual way to get wasm past a
  policy is `'unsafe-eval'`, which hands back `eval` and `new Function` as well.
- **ICC has no other route.** The colour engine is WebAssembly with no
  JavaScript fallback, so leaving the policy alone means CMYK and ICC-based
  colour stay unsupported and pdf.js keeps warning about it on the console for
  every print-origin document.

`quickjs-eval.wasm` is deliberately not copied. It exists to run the JavaScript
embedded in XFA forms, scripting is never enabled here, and it is a third of the
size of everything else in the directory.

## Consequences

- `script-src` now carries a second concession beside `style-src`'s
  `'unsafe-inline'`. Both are written down; neither touches `connect-src`.
- The JavaScript fallback decoders are copied too, though the WebAssembly ones
  are expected to win. pdf.js falls back on its own if a browser or a policy
  refuses wasm, so the two can fail independently and the worst case is a slower
  decode rather than a missing image.
- About 1 MB is added to the deploy and none of it to the bundle. Nothing under
  `/pdfjs/` is fetched until a document needs it, so a PDF with no JPEG 2000
  image never pays for the decoder.
- pdf.js builds these paths by name rather than by listing a directory, so a
  rename in a pdfjs-dist upgrade would not 404 anywhere anyone is looking. The
  asset test names all six files for that reason.
- In development the plugin has to send a JavaScript content type for the
  fallbacks, which are loaded with `import()` and refused on MIME type alone.
  A host sets that from the extension; in development this plugin is the host.
- Verified on a production build served with the generated `_headers` applied,
  converting a four-page PDF through PDF to JPG: a JPEG 2000 image, a CCITT fax
  image, a set of CMYK swatches, and an arithmetic-coded JBIG2 generic region.
  All four come out as images, all four asset files are fetched, no JavaScript
  fallback is, and the console is clean. The JBIG2 page was compared against the
  bitmap it was encoded from and agreed on every sampled pixel; the CMYK swatches
  are process colours (cyan `RGB(0,173,239)`) rather than the flat approximation
  pdf.js falls back on.
- Serving the same build behind the old, narrower policy confirms the split:
  both image decoders fall through to their JavaScript builds and produce
  pixel-identical pages — the JBIG2 page still matches its source bitmap exactly
  — while the colour profile has nowhere to fall, so pdf.js warns three times and
  the swatches shift. Losing colour quietly is the failure this avoids.
