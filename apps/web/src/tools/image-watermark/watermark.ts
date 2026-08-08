import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import { uniqueEntryName, zipEntries } from '@/lib/zip';

export interface SourceImage {
  name: string;
  type: string;
  bytes: ArrayBuffer;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ANCHORS = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
] as const;

export type Anchor = (typeof ANCHORS)[number];

export interface Placement {
  anchor: Anchor;
  /** The mark's width as a share of the image's width, 0..1. */
  scale: number;
  /** The gap from the edges, also as a share of the image's width, 0..1. */
  margin: number;
}

/** Nothing smaller than this is a mark, it is a speck. */
const MIN_SIDE = 1;

/**
 * Where the mark lands on one image, in that image's own pixels.
 *
 * Both the size and the gap are shares of the image rather than pixel counts,
 * and that is the whole reason a batch works. A 200px mark is a bar across a
 * thumbnail and a speck on a 6000px photo; a mark 20% of the width is the same
 * mark on both. Every batch tool here has had to learn this in its own way —
 * resize fits inside a box, rotate applies one turn to all — and this is the
 * watermark's version of it.
 */
export function placeMark(image: Dimensions, mark: Dimensions, placement: Placement): Rect {
  const ratio = mark.width > 0 ? mark.height / mark.width : 1;
  const gap = Math.round(image.width * clamp01(placement.margin));

  let width = Math.round(image.width * clamp01(placement.scale));
  let height = Math.round(width * ratio);

  // The mark has to fit between the margins, not merely inside the image, or a
  // corner mark on a wide-and-short picture hangs off the bottom.
  const roomWidth = Math.max(image.width - gap * 2, MIN_SIDE);
  const roomHeight = Math.max(image.height - gap * 2, MIN_SIDE);

  if (width > roomWidth) {
    width = roomWidth;
    height = Math.round(width * ratio);
  }

  if (height > roomHeight) {
    height = roomHeight;
    width = Math.round(height / ratio);
  }

  width = Math.max(width, MIN_SIDE);
  height = Math.max(height, MIN_SIDE);

  const west = placement.anchor.includes('left');
  const east = placement.anchor.includes('right');
  const north = placement.anchor.includes('top');
  const south = placement.anchor.includes('bottom');

  // A centred mark answers to no margin: the middle is the middle.
  const x = west ? gap : east ? image.width - width - gap : (image.width - width) / 2;
  const y = north ? gap : south ? image.height - height - gap : (image.height - height) / 2;

  return {
    x: Math.min(Math.max(Math.round(x), 0), Math.max(image.width - width, 0)),
    y: Math.min(Math.max(Math.round(y), 0), Math.max(image.height - height, 0)),
    width,
    height,
  };
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
}

/** Stamps one image, returning it encoded in the format it already was. */
export type ImageStamper = (image: SourceImage) => Promise<Uint8Array>;

export interface WatermarkOutput {
  bytes: ArrayBuffer;
  kind: 'image' | 'zip';
  imageCount: number;
  /** The name of a single result; stamping does not change the format. */
  name?: string;
}

/**
 * Stamps a batch and packages it.
 *
 * Stamping is injected so the batching and the naming stay testable without a
 * canvas; where the mark goes is `placeMark`, tested on its own.
 */
export async function watermarkImages(
  images: SourceImage[],
  stamp: ImageStamper,
  report: ProgressReporter,
): Promise<WatermarkOutput> {
  if (images.length === 0) {
    throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');
  }

  const results: Array<{ entry: string; bytes: Uint8Array }> = [];
  const taken = new Set<string>();

  for (const [index, image] of images.entries()) {
    report(index / images.length, `Stamping ${image.name}`);

    results.push({
      entry: uniqueEntryName(taken, image.name),
      bytes: await stamp(image),
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
