import { ToolError } from '@convyx/tool-contract';
import { FORMAT_MIME, keepsAlpha, type RasterFormat } from './formats';

/**
 * The decode/encode engine every image tool shares.
 *
 * The browser already ships one: `createImageBitmap` decodes, `OffscreenCanvas`
 * plus `convertToBlob` encodes. That covers convert, compress, resize, crop and
 * rotate without adding a dependency, and it works inside a worker, which a DOM
 * canvas does not.
 *
 * Every failure here is named. An image that silently comes back as a PNG when
 * AVIF was asked for is worse than an error, because nothing tells the person
 * they did not get what they chose.
 */

const NO_CANVAS_HINT = 'Try a recent version of Chrome, Edge, Firefox or Safari.';

/** Decodes bytes into a bitmap, upright and ready to draw. */
export async function decodeImage(
  bytes: ArrayBuffer,
  name: string,
  type?: string,
): Promise<ImageBitmap> {
  try {
    // Phone photos carry their rotation in EXIF rather than in the pixels.
    // Without this, a portrait shot converts to a sideways image.
    return await createImageBitmap(new Blob([bytes], { type }), {
      imageOrientation: 'from-image',
    });
  } catch (cause) {
    throw new ToolError('CORRUPT_FILE', `“${name}” could not be read as an image.`, {
      hint: 'It may be damaged, or in a format this browser cannot open.',
      cause,
    });
  }
}

export interface EncodeOptions {
  format: RasterFormat;
  /** 0..1, ignored by lossless formats. */
  quality: number;
  /** Defaults to the bitmap's own size. */
  width?: number;
  height?: number;
}

/** Draws a bitmap and encodes it in the target format. */
export async function encodeImage(
  bitmap: ImageBitmap,
  { format, quality, width, height }: EncodeOptions,
): Promise<Uint8Array<ArrayBuffer>> {
  const canvas = createCanvas(width ?? bitmap.width, height ?? bitmap.height);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new ToolError('PROCESSING_FAILED', 'This browser could not draw the image.', {
      hint: NO_CANVAS_HINT,
    });
  }

  // JPG has no alpha channel: anything transparent would come out black.
  if (!keepsAlpha(format)) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const mimeType = FORMAT_MIME[format];
  const blob = await canvas.convertToBlob({ type: mimeType, quality });

  // An encoder that does not know the format falls back to PNG instead of
  // failing, so the returned type is the only honest signal.
  if (blob.type !== mimeType) {
    throw unsupportedFormat(format);
  }

  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Whether this browser can actually write the format.
 *
 * AVIF is the reason this exists: `convertToBlob` support for it is uneven, and
 * the answer can only be had by trying. The probe is one pixel and the result is
 * cached, so a tool can ask before it offers the option.
 */
const probes = new Map<RasterFormat, Promise<boolean>>();

export function canEncode(format: RasterFormat): Promise<boolean> {
  let probe = probes.get(format);

  if (!probe) {
    probe = runProbe(format);
    probes.set(format, probe);
  }

  return probe;
}

async function runProbe(format: RasterFormat): Promise<boolean> {
  if (typeof OffscreenCanvas === 'undefined') return false;

  try {
    const canvas = new OffscreenCanvas(1, 1);

    // A canvas that was never drawn on has no rendering context, and asking it
    // for a blob throws rather than encoding anything. Without this the probe
    // reports every format as unsupported.
    canvas.getContext('2d');

    const blob = await canvas.convertToBlob({ type: FORMAT_MIME[format] });
    return blob.type === FORMAT_MIME[format];
  } catch {
    return false;
  }
}

/** Fails before any work when the chosen format cannot be written here. */
export async function requireEncoder(format: RasterFormat): Promise<void> {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new ToolError('PROCESSING_FAILED', 'This browser cannot convert images.', {
      hint: NO_CANVAS_HINT,
    });
  }

  if (!(await canEncode(format))) {
    throw unsupportedFormat(format);
  }
}

function createCanvas(width: number, height: number): OffscreenCanvas {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new ToolError('PROCESSING_FAILED', 'This browser cannot convert images.', {
      hint: NO_CANVAS_HINT,
    });
  }

  return new OffscreenCanvas(Math.max(Math.round(width), 1), Math.max(Math.round(height), 1));
}

function unsupportedFormat(format: RasterFormat): ToolError {
  return new ToolError(
    'PROCESSING_FAILED',
    `This browser cannot write ${format.toUpperCase()} images.`,
    { hint: 'Choose another format — PNG, JPG and WEBP work everywhere.' },
  );
}
