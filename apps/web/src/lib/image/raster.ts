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
  /** Defaults to the source rectangle's size. */
  width?: number;
  height?: number;
  /**
   * The part of the bitmap to take, in source pixels. Defaults to all of it.
   */
  source?: { x: number; y: number; width: number; height: number };
  /**
   * Mirrors first, then turns. A quarter turn swaps the output's sides, so the
   * canvas is sized from the result rather than from the bitmap.
   */
  orientation?: { rotation: number; flipX: boolean; flipY: boolean };
  /**
   * Drawn on top of the result, in the output's own pixels. Unlike the three
   * above this one composes rather than competes: it is not another way to draw
   * the source, it is something added after whichever way was used.
   */
  stamps?: Stamp[];
}

export interface Stamp {
  image: CanvasImageSource;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 0..1. */
  opacity: number;
}

/**
 * Draws a bitmap and encodes it in the target format.
 *
 * The three source adjustments — a region, a turn, a smaller size — are
 * deliberately separate paths rather than one general transform. No tool asks
 * for two at once, and each has a different right answer about resampling: a
 * crop and a quarter turn move whole pixels and must not be filtered, while a
 * downscale has to be.
 */
export async function encodeImage(
  bitmap: ImageBitmap,
  { format, quality, width, height, source, orientation, stamps }: EncodeOptions,
): Promise<Uint8Array<ArrayBuffer>> {
  const take = source ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const turned = orientation ? Math.abs(orientation.rotation) % 180 === 90 : false;

  const canvas = createCanvas(
    width ?? (turned ? take.height : take.width),
    height ?? (turned ? take.width : take.height),
  );
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

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  if (orientation) {
    // The canvas transform stack applies in reverse, so setting the rotation
    // before the mirror is what draws the mirror first — which is the order the
    // orientation is defined in.
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((orientation.rotation * Math.PI) / 180);
    context.scale(orientation.flipX ? -1 : 1, orientation.flipY ? -1 : 1);
    context.drawImage(bitmap, -take.width / 2, -take.height / 2, take.width, take.height);
  } else if (source) {
    // Taking a region and scaling it are separable, and no tool asks for both
    // at once. Cropping draws the pixels straight across at 1:1, where the
    // stepping below would only cost time.
    context.drawImage(
      bitmap,
      take.x,
      take.y,
      take.width,
      take.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  } else {
    context.drawImage(
      halveDownTo(bitmap, canvas.width, canvas.height),
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }

  for (const stamp of stamps ?? []) {
    // Reset first: an orientation left a transform on the stack, and a stamp is
    // positioned in the output's pixels, not the source's.
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = Math.min(Math.max(stamp.opacity, 0), 1);
    context.drawImage(stamp.image, stamp.x, stamp.y, stamp.width, stamp.height);
  }

  context.globalAlpha = 1;

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

/**
 * Shrinks in halving steps until one more would overshoot.
 *
 * This is insurance, not the thing carrying the quality. Measured in Chromium
 * on a 2400px source of 1px stripes taken to 240px, stepped and single-draw
 * were indistinguishable — both 0.37 neighbour-to-neighbour jitter, with the
 * stepped version matching the source's mean brightness exactly. The engine's
 * own filter is already reading the whole source. The steps are here for
 * engines whose single big jump is worse, and they cost a few intermediate
 * canvases only when shrinking past half size.
 *
 * Do not lean on this to justify a quality claim in product copy, and do not
 * delete it on the strength of one engine measuring flat.
 */
function halveDownTo(
  bitmap: ImageBitmap,
  width: number,
  height: number,
): ImageBitmap | OffscreenCanvas {
  let current: ImageBitmap | OffscreenCanvas = bitmap;
  let currentWidth = bitmap.width;
  let currentHeight = bitmap.height;

  while (currentWidth / 2 > width && currentHeight / 2 > height) {
    currentWidth = Math.max(Math.round(currentWidth / 2), width);
    currentHeight = Math.max(Math.round(currentHeight / 2), height);

    const step = createCanvas(currentWidth, currentHeight);
    const context = step.getContext('2d');
    if (!context) return current;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(current, 0, 0, currentWidth, currentHeight);
    current = step;
  }

  return current;
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
