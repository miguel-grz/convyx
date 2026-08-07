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
} as const;
