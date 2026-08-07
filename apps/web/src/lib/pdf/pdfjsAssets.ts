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
