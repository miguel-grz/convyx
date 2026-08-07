import { zipSync } from 'fflate';

/**
 * Bundles several outputs into one download.
 *
 * Tools that produce many files — split, PDF to JPG — still hand the run a
 * single blob, because the whole result pipeline is built around one file
 * arriving at the end. Compression is off: PDFs and JPEGs are already
 * compressed, so deflating them costs time and saves almost nothing.
 *
 * Synchronous by design. This only ever runs inside a worker.
 */
export function zipEntries(entries: Record<string, Uint8Array>): ArrayBuffer {
  const zipped = zipSync(entries, { level: 0 });
  return new Uint8Array(zipped).buffer;
}

/** Keeps a generated entry name safe for every zip reader and filesystem. */
export function safeEntryName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 120);
}

/**
 * Makes a name safe and keeps it distinct from the ones already in the archive,
 * recording it as taken.
 *
 * An archive is built from a map, so two sources that converge on one name lose
 * the first silently — `logo.png` and `logo.jpg` both become `logo.webp`. The
 * suffix keeps both files, and keeps them recognisable.
 */
export function uniqueEntryName(taken: Set<string>, name: string): string {
  const safe = safeEntryName(name);
  const dot = safe.lastIndexOf('.');
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const extension = dot > 0 ? safe.slice(dot) : '';

  let candidate = safe;
  let counter = 2;

  while (taken.has(candidate)) {
    candidate = `${stem}-${counter}${extension}`;
    counter += 1;
  }

  taken.add(candidate);
  return candidate;
}
