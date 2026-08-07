import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

/** Where the files are served from, relative to the app's base URL. */
export const PDFJS_ASSET_DIR = 'pdfjs';

const BUNDLES = ['standard_fonts', 'cmaps'] as const;

/**
 * Serves pdf.js's font and character-map data.
 *
 * pdf.js does not carry these inside its bundle. When a PDF uses one of the
 * fourteen standard fonts without embedding it — which is what Word, Docs and
 * most exporters produce — pdf.js fetches the font data at render time. If it
 * cannot, every glyph draws as an empty box: the layout, images and colours all
 * come out correct and only the text is gone, which is exactly how this failure
 * looks and exactly why it is easy to miss.
 *
 * The same applies to CMaps, which decode CJK and other non-Latin encodings.
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
    return readdirSync(directory).map((name) => ({
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

        response.setHeader('Content-Type', 'application/octet-stream');
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
