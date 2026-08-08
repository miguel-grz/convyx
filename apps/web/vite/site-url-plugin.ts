import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Everything that has to know the site's public address.
 *
 * Link previews, the canonical link and the sitemap all need absolute URLs, and
 * three copies of the same guess is three chances to publish one that points
 * somewhere else. The address is resolved once in the Vite config and handed
 * here; `%SITE_URL%` in `index.html` is filled in from the same value.
 *
 * The tool list comes from the manifests, like every other surface that lists
 * tools. A sitemap is the one place a stale list is invisible — nothing looks
 * broken, the pages simply never get found — so it is the last place to keep
 * one by hand. Manifests are parsed rather than imported because this runs
 * before the app's module graph exists, the same way `icons-plugin` reads them.
 */
export function convyxSiteUrl(origin: string): Plugin {
  return {
    name: 'convyx:site-url',

    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', origin);
    },

    generateBundle() {
      // Planned tools have a real page, but it says "Soon" and nothing else.
      // Asking a search engine to index fourteen of those buys thin results
      // against our own name; they go in when they work.
      const available: string[] = [];

      for (const file of globSync('src/tools/*/manifest.ts', { cwd: process.cwd() })) {
        const source = readFileSync(path.resolve(process.cwd(), file), 'utf8');
        if (!/status:\s*'available'/.test(source)) continue;

        available.push(path.basename(path.dirname(file)));
      }

      const routes = ['/', '/tools', '/privacy', ...available.sort().map((id) => `/tools/${id}`)];

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          routes.map((route) => `  <url>\n    <loc>${origin}${route}</loc>\n  </url>`).join('\n') +
          '\n</urlset>\n',
      });

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: ['User-agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n'),
      });
    },
  };
}
