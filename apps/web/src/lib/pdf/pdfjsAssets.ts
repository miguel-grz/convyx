/**
 * Where pdf.js should fetch its font and character-map data.
 *
 * Without these, a PDF that uses a standard font without embedding it renders
 * every glyph as an empty box — the page layout, images and colours all come
 * out right and only the text disappears.
 *
 * Built from `BASE_URL` so the app still works when it is deployed under a
 * sub-path, and made absolute because these are resolved inside a worker, where
 * a relative URL would resolve against the worker script instead of the site.
 */
const base = new URL(import.meta.env.BASE_URL, self.location.origin).href;

export const PDFJS_ASSETS = {
  standardFontDataUrl: `${base}pdfjs/standard_fonts/`,
  cMapUrl: `${base}pdfjs/cmaps/`,
  cMapPacked: true,

  /**
   * Fetch that data from pdf.js's own worker, not from the thread that asked.
   *
   * The other path fetches on the calling thread, and the check it makes first —
   * is this URL one `fetch` can take — reads `document.baseURI`. There is no
   * `document` in a worker, so the read throws before any request is made and
   * every asset is reported as "Unable to load font data at", naming a URL that
   * was correct all along.
   *
   * pdf.js will choose this path by itself, but only when a `wasmUrl` is
   * configured as well, and the test it uses to decide reads `document.baseURI`
   * too. Both of those make it something to state rather than leave inferred.
   */
  useWorkerFetch: true,

  /**
   * The WebAssembly decoders are not served, so do not let pdf.js reach for
   * them.
   *
   * `useWorkerFetch` is what switches them on upstream, and they need two things
   * this build does not have: the `wasm` directory alongside the fonts and CMaps
   * above, and `'wasm-unsafe-eval'` in a content policy that is deliberately
   * narrow. Saying no here keeps that decision explicit — and keeps pdf.js from
   * announcing the absence on the console for every document that has an ICC
   * colour space. JPEG 2000 and JBIG2 images already do not decode without it.
   */
  useWasm: false,

  /**
   * Draw glyph outlines instead of installing the fonts and letting the
   * browser's text engine do it.
   *
   * Installing a font means registering a `FontFace`, which belongs to a
   * document. We render inside a worker, where there is no document, and the
   * fallback path is what produced pages of empty boxes. Rasterising the
   * outlines has no such dependency: whatever the file embeds is what gets
   * drawn.
   *
   * The cost is the browser's hinting, which does not apply to outlines. At the
   * scales this renders (2× and 3× for anything but a preview) that is not
   * visible, and correct-but-unhinted beats absent.
   */
  disableFontFace: true,
} as const;
