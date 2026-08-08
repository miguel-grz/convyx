import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

/** Where the files are served from, relative to the app's base URL. */
export const PDFJS_ASSET_DIR = 'pdfjs';

const BUNDLES = ['standard_fonts', 'cmaps', 'wasm', 'iccs'] as const;

/**
 * pdf.js's QuickJS build, which is there to run the JavaScript embedded in XFA
 * forms. Scripting is never switched on here and nothing in the worker build so
 * much as names the file — only `pdf.sandbox.mjs`, which this app never loads.
 * It is also a third of the size of everything else in `wasm` put together, so
 * it is left behind on purpose rather than by oversight.
 */
const UNUSED = /^quickjs-eval\./;

/**
 * A module the browser is asked to `import` has to arrive as JavaScript or it
 * is refused on its MIME type alone, whatever the file actually contains. The
 * JS fallback decoders below are loaded exactly that way, so the type matters:
 * a host sets it from the extension, and in development this middleware is the
 * host.
 */
const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.wasm': 'application/wasm',
};

/**
 * Serves the data files pdf.js fetches at render time instead of bundling.
 *
 * pdf.js does not carry any of these inside its bundle, and each one is missed
 * in a different way:
 *
 * `standard_fonts` — when a PDF uses one of the fourteen standard fonts without
 * embedding it, which is what Word, Docs and most exporters produce, pdf.js
 * fetches the font data. If it cannot, every glyph draws as an empty box: the
 * layout, images and colours all come out correct and only the text is gone,
 * which is exactly how this failure looks and exactly why it is easy to miss.
 *
 * `cmaps` — the same, for the encodings that decode CJK and other non-Latin
 * text.
 *
 * `wasm` — JPEG 2000 and JBIG2 are not formats a browser can decode. Nothing
 * on the platform reads them, so pdf.js ships its own decoders as WebAssembly,
 * and without them a scanned page renders as a blank rectangle with the text
 * and rules around it perfectly intact. `qcms_bg.wasm` is the colour engine
 * that ICC-based and CMYK colour needs; print-origin PDFs are full of both.
 *
 * `iccs` — the CMYK profile that engine converts against.
 *
 * The `*_nowasm_fallback.js` files in `wasm` are plain-JavaScript builds of the
 * same two image decoders. pdf.js reaches for one on its own if WebAssembly is
 * refused, so they are worth their size: the policy and the decoders can then
 * fail independently, and the worst case is a slower decode rather than a
 * missing image. The licence files are copied for the same reason they exist —
 * these are third-party binaries, and redistributing them carries the
 * attribution.
 *
 * They are static files rather than bundled modules, so they are copied into
 * the build and served straight from `node_modules` in development. Nothing is
 * fetched until a document actually needs it.
 */
export function convyxPdfjsAssets(): Plugin {
  const require = createRequire(import.meta.url);
  const root = path.dirname(require.resolve('pdfjs-dist/package.json'));

  const files = BUNDLES.flatMap((bundle) => {
    const directory = path.join(root, bundle);
    return readdirSync(directory)
      .filter((name) => !UNUSED.test(name))
      .map((name) => ({
        route: `${PDFJS_ASSET_DIR}/${bundle}/${name}`,
        source: path.join(directory, name),
      }));
  });

  return {
    name: 'convyx:pdfjs-assets',

    configureServer(server) {
      const byRoute = new Map(files.map((file) => [`/${file.route}`, file.source]));

      server.middlewares.use((request, response, next) => {
        const url = request.url?.split('?')[0];
        const source = url ? byRoute.get(url) : undefined;
        if (!source) return next();

        const type = CONTENT_TYPES[path.extname(source)] ?? 'application/octet-stream';
        response.setHeader('Content-Type', type);
        response.end(readFileSync(source));
      });
    },

    generateBundle() {
      for (const file of files) {
        this.emitFile({
          type: 'asset',
          // Emitted verbatim: pdf.js builds these paths itself from the
          // directory URL, so a hashed filename would never be found.
          fileName: file.route,
          source: readFileSync(file.source),
        });
      }
    },
  };
}
