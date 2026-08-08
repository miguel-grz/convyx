/**
 * Where pdf.js should fetch the data it does not carry in its bundle: fonts,
 * character maps, image decoders and a colour profile.
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
   * The decoders for the two image formats a browser cannot read, and the
   * profile that turns print colour into screen colour.
   *
   * JPEG 2000 and JBIG2 are not web image formats — nothing on the platform
   * decodes them — so pdf.js ships its own decoders as WebAssembly and fetches
   * them from `wasmUrl`. Leave it unset and those images are simply dropped:
   * a scanned page comes out blank, with the text and rules around it perfectly
   * intact, which is the same shape of failure as the missing fonts above.
   * `iccUrl` is the CMYK profile that ICC-based colour converts against.
   *
   * These are why the content policy names `'wasm-unsafe-eval'`. That was a
   * deliberate widening of a deliberately narrow policy — the reasoning is in
   * `vite/headers-plugin.ts`, argued at length in ADR 10.
   */
  wasmUrl: `${base}pdfjs/wasm/`,
  iccUrl: `${base}pdfjs/iccs/`,

  /**
   * Fetch that data from pdf.js's own worker, not from the thread that asked.
   *
   * The other path fetches on the calling thread, and the check it makes first —
   * is this URL one `fetch` can take — reads `document.baseURI`. There is no
   * `document` in a worker, so the read throws before any request is made and
   * every asset is reported as "Unable to load font data at", naming a URL that
   * was correct all along.
   *
   * pdf.js would now pick this path by itself — it wants a `wasmUrl`, and there
   * is one above — except that the test it uses to decide reads
   * `document.baseURI` as well, and throws on that read before it can reach a
   * conclusion. Stating the answer is what stops the question being asked.
   */
  useWorkerFetch: true,

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
