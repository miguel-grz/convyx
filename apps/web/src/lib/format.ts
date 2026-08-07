const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  const decimals = exponent === 0 || value >= 100 ? 0 : 1;

  return `${value.toFixed(decimals)} ${BYTE_UNITS[exponent]}`;
}

/** "report.final.pdf" -> "report.final" */
export function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(0, dot) : filename;
}

/**
 * Keeps a filename recognisable inside a fixed-width row without hiding the
 * extension, which is often the only thing distinguishing two files.
 */
export function truncateFilename(filename: string, maxLength = 40): string {
  if (filename.length <= maxLength) return filename;

  const dot = filename.lastIndexOf('.');
  const extension = dot > 0 ? filename.slice(dot) : '';
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const keep = Math.max(maxLength - extension.length - 1, 4);

  return `${stem.slice(0, keep)}…${extension}`;
}

/** Percentage difference in size, e.g. -68 for a file compressed to a third. */
export function sizeDelta(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round(((after - before) / before) * 100);
}
