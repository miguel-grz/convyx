import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const source = path.resolve(import.meta.dirname, '../..');

/**
 * A guard against a failure that looks like nothing is wrong.
 *
 * pdf.js fetches font and character-map data at render time. Forget to tell it
 * where they are and the page still renders — layout, images and colours all
 * correct — with every glyph drawn as an empty box. It shipped that way once;
 * these assertions are what makes it loud the next time.
 *
 * The check is on the source text rather than on behaviour because the
 * alternative needs a canvas, and the mistake being guarded is a missing
 * argument, which is exactly what reading the call site catches.
 */
describe('pdf.js worker and asset configuration', () => {
  const callSites = walk(source).filter((file) =>
    readFileSync(file, 'utf8').includes('getDocument('),
  );

  it('finds every place a document is opened', () => {
    expect(callSites.length).toBeGreaterThan(0);
  });

  it('passes the font and CMap locations at every one of them', () => {
    for (const file of callSites) {
      const text = readFileSync(file, 'utf8');
      expect(
        text,
        `${path.relative(source, file)} opens a document without PDFJS_ASSETS`,
      ).toContain('PDFJS_ASSETS');
    }
  });

  /**
   * The same shape of failure, one thread over. Leave pdf.js to start its own
   * worker and it cannot — there is no `window` in a worker for its bootstrap to
   * read — so it silently runs on the calling thread instead, and the only
   * outward sign is a console warning nobody is watching for.
   */
  it('starts the worker itself at every one of them', () => {
    for (const file of callSites) {
      const text = readFileSync(file, 'utf8');
      expect(
        text,
        `${path.relative(source, file)} opens a document without startPdfjsWorker`,
      ).toContain('startPdfjsWorker');
    }
  });

  it('still finds the files pdf.js expects to fetch', () => {
    const root = path.dirname(require.resolve('pdfjs-dist/package.json'));

    // If a pdfjs-dist upgrade moves or renames these, the plugin serves
    // nothing and text silently disappears again.
    expect(readdirSync(path.join(root, 'standard_fonts')).length).toBeGreaterThan(10);
    expect(readdirSync(path.join(root, 'cmaps')).length).toBeGreaterThan(100);
  });
});

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : [];
  });
}
