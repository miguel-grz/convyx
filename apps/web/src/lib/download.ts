/**
 * Triggers a browser download for a Blob produced by a tool handler.
 *
 * The object URL is revoked on the next tick — long enough for the click to be
 * handled, short enough that a large result is not pinned in memory.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
