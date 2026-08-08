import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/**
 * Emits the host configuration a static deploy needs: a content policy, the
 * security headers, cache lifetimes, and the single-page fallback.
 *
 * `_headers` and `_redirects` are read by both Cloudflare Pages and Netlify, so
 * this does not tie the site to one of them.
 *
 * The policy is not decoration. `connect-src 'self'` means the page cannot send
 * anything anywhere but back here, and there is no endpoint here to send it to.
 * The promise on every tool page — that the file stays on the device — stops
 * being something a visitor has to take on trust and becomes something their
 * browser enforces. Widen it only with a reason worth writing down.
 */
export function convyxHeaders(): Plugin {
  return {
    name: 'convyx:headers',
    apply: 'build',
    // The HTML is written by a core plugin's own `generateBundle`, so this has
    // to run after it or there is nothing to read and nothing to hash.
    enforce: 'post',

    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      const source = html?.type === 'asset' ? String(html.source) : '';

      // The theme is applied by an inline script before paint, so the policy
      // has to name it. Hashing what was actually built keeps the two in step:
      // edit the script and the hash follows, rather than silently blocking it
      // and bringing back the flash of the wrong theme.
      const hashes = [...source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
        .map((match) => match[1] ?? '')
        .filter((code) => code.trim() !== '')
        .map((code) => `'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`);

      // A policy that names no script is not a stricter policy, it is a broken
      // page: the theme script is blocked and every visit flashes the wrong
      // one. That failure is invisible in dev, where no policy is served, so
      // it fails the build instead.
      if (hashes.length === 0) {
        this.error(
          'No inline script found in the built index.html. Either the theme ' +
            'script was removed — in which case delete this check — or this ' +
            'plugin ran before the HTML was generated and the policy would ' +
            'have blocked it.',
        );
      }

      const policy = [
        "default-src 'self'",
        `script-src 'self' ${hashes.join(' ')}`.trim(),
        // Element styles come from built files; the `style` attributes React
        // writes for previews and selections cannot be hashed.
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data:",
        "font-src 'self'",
        // Every tool runs in a worker, and pdf.js starts one of its own.
        "worker-src 'self' blob:",
        // Nothing is uploaded, so nothing may be.
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ].join('; ');

      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: [
          '/*',
          `  Content-Security-Policy: ${policy}`,
          '  X-Content-Type-Options: nosniff',
          '  X-Frame-Options: DENY',
          // No analytics and no outbound requests, so there is no reason to
          // tell anyone else where a visitor came from either.
          '  Referrer-Policy: no-referrer',
          '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          '  Cross-Origin-Opener-Policy: same-origin',
          '  Cross-Origin-Resource-Policy: same-origin',
          '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
          '',
          '# Hashed by the build, so they can never be the stale copy.',
          '/assets/*',
          '  Cache-Control: public, max-age=31536000, immutable',
          '',
          '# Named by pdf.js rather than hashed: a week, so a version bump lands.',
          '/pdfjs/*',
          '  Cache-Control: public, max-age=604800',
          '',
          '# The one file that must never be stale, or a deploy does not land.',
          '/index.html',
          '  Cache-Control: no-cache',
          '',
        ].join('\n'),
      });

      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: [
          '# Routing is client-side, so every path has to reach the app rather',
          '# than 404 at the edge. 200, not 302: the URL the visitor typed is',
          '# the one the router reads and the one that stays in the bar.',
          '/*  /index.html  200',
          '',
        ].join('\n'),
      });
    },
  };
}
