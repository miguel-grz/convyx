/**
 * The raster formats this product converts between.
 *
 * Pure data on purpose: the canvas lives in `raster.ts`, which only a worker can
 * import, while these tables are needed by the tool UI, the handlers and the
 * tests as well.
 */

export const RASTER_FORMATS = ['png', 'jpg', 'webp', 'avif'] as const;

export type RasterFormat = (typeof RASTER_FORMATS)[number];

export const FORMAT_MIME: Record<RasterFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
};

export const FORMAT_LABEL: Record<RasterFormat, string> = {
  png: 'PNG',
  jpg: 'JPG',
  webp: 'WEBP',
  avif: 'AVIF',
};

/**
 * Whether the encoder reads a quality setting. PNG ignores it — it is lossless,
 * so offering the control would suggest a trade-off that is not there.
 */
export function isLossy(format: RasterFormat): boolean {
  return format !== 'png';
}

/** Whether the format can carry transparency through the conversion. */
export function keepsAlpha(format: RasterFormat): boolean {
  return format !== 'jpg';
}

export function isRasterFormat(value: string): value is RasterFormat {
  return (RASTER_FORMATS as readonly string[]).includes(value);
}

const BY_MIME: Record<string, RasterFormat> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const BY_EXTENSION: Record<string, RasterFormat> = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  webp: 'webp',
  avif: 'avif',
};

/**
 * Which format a file already is, for tools that keep it rather than change it.
 *
 * The declared type comes first, but browsers leave it empty often enough — it
 * is blank for many files on Linux — that the extension has to be the fallback.
 * `null` means neither said anything we recognise.
 */
export function formatOf(name: string, type?: string): RasterFormat | null {
  const declared = type ? BY_MIME[type.toLowerCase()] : undefined;
  if (declared) return declared;

  const dot = name.lastIndexOf('.');
  if (dot < 0) return null;

  return BY_EXTENSION[name.slice(dot + 1).toLowerCase()] ?? null;
}
