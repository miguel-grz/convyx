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
