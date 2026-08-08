import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import { uniqueEntryName, zipEntries } from '@/lib/zip';

export interface SourceImage {
  name: string;
  type: string;
  bytes: ArrayBuffer;
}

export type Quarter = 0 | 90 | 180 | 270;

/**
 * How the image ends up, as one state rather than a list of steps.
 *
 * Mirrors are applied first and the turn last. Any sequence of buttons collapses
 * into this, which is why pressing rotate four times gets back to where it
 * started instead of stacking four transforms and four re-encodes.
 */
export interface Orientation {
  rotation: Quarter;
  flipX: boolean;
  flipY: boolean;
}

export const UPRIGHT: Orientation = { rotation: 0, flipX: false, flipY: false };

export function isUpright(orientation: Orientation): boolean {
  return orientation.rotation === 0 && !orientation.flipX && !orientation.flipY;
}

/** A quarter turn, positive clockwise. */
export function turn(orientation: Orientation, degrees: number): Orientation {
  return {
    ...orientation,
    rotation: ((((orientation.rotation + degrees) % 360) + 360) % 360) as Quarter,
  };
}

/**
 * Mirrors what the person is looking at, not what is stored.
 *
 * The buttons act on the preview, so "flip horizontally" has to mean the
 * on-screen horizontal. Once the image is on its side, that is the stored
 * image's vertical — get this backwards and the button visibly does the wrong
 * one of the two, but only after a rotation, which is exactly the case nobody
 * tries by hand.
 */
export function flip(orientation: Orientation, axis: 'horizontal' | 'vertical'): Orientation {
  const onItsSide = orientation.rotation === 90 || orientation.rotation === 270;
  const mirrorsX = (axis === 'horizontal') !== onItsSide;

  return mirrorsX
    ? { ...orientation, flipX: !orientation.flipX }
    : { ...orientation, flipY: !orientation.flipY };
}

/** The size the result comes out at, since a quarter turn swaps the sides. */
export function orientedSize(
  size: { width: number; height: number },
  orientation: Orientation,
): { width: number; height: number } {
  return orientation.rotation === 90 || orientation.rotation === 270
    ? { width: size.height, height: size.width }
    : { width: size.width, height: size.height };
}

/** The CSS transform that shows the orientation without re-encoding anything. */
export function previewTransform(orientation: Orientation): string {
  const scaleX = orientation.flipX ? -1 : 1;
  const scaleY = orientation.flipY ? -1 : 1;
  return `rotate(${orientation.rotation}deg) scale(${scaleX}, ${scaleY})`;
}

export type ImageRotator = (image: SourceImage) => Promise<Uint8Array>;

export interface RotateOutput {
  bytes: ArrayBuffer;
  kind: 'image' | 'zip';
  imageCount: number;
  /** The name of a single result; the format does not change, so nor does it. */
  name?: string;
}

/**
 * Turns a batch and packages it.
 *
 * The turn is injected so the batching and naming stay testable without a
 * canvas; what the turn actually is lives in `Orientation` above, tested on its
 * own.
 */
export async function rotateImages(
  images: SourceImage[],
  rotate: ImageRotator,
  report: ProgressReporter,
): Promise<RotateOutput> {
  if (images.length === 0) {
    throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');
  }

  const results: Array<{ entry: string; bytes: Uint8Array }> = [];
  const taken = new Set<string>();

  for (const [index, image] of images.entries()) {
    report(index / images.length, `Turning ${image.name}`);

    results.push({
      entry: uniqueEntryName(taken, image.name),
      bytes: await rotate(image),
    });
  }

  const single = results[0];
  if (results.length === 1 && single) {
    return {
      bytes: single.bytes.slice().buffer as ArrayBuffer,
      kind: 'image',
      imageCount: 1,
      name: single.entry,
    };
  }

  report(0.97, 'Bundling the images');

  return {
    bytes: zipEntries(Object.fromEntries(results.map((item) => [item.entry, item.bytes]))),
    kind: 'zip',
    imageCount: results.length,
  };
}
