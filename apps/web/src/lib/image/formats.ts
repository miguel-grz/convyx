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
