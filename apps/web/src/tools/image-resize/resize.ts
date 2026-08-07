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

export type ResizeSpec =
  | { mode: 'percent'; percent: number }
  | {
      mode: 'pixels';
      /** `null` means unconstrained in that direction. */
      width: number | null;
      height: number | null;
      keepAspect: boolean;
    };

/**
 * What one image becomes.
 *
 * With the ratio locked, width and height are a box to fit inside rather than
 * an exact size. That is what makes a batch work: twenty photos, some portrait
 * and some landscape, all come back within 1200×1200 and none of them
 * stretched. Giving only one dimension scales by that one alone.
 */
export function targetSize(source: Dimensions, spec: ResizeSpec): Dimensions {
  if (spec.mode === 'percent') {
    return clamp({
      width: Math.round((source.width * spec.percent) / 100),
      height: Math.round((source.height * spec.percent) / 100),
    });
  }

  const { width, height, keepAspect } = spec;

  if (!keepAspect) {
    return clamp({ width: width ?? source.width, height: height ?? source.height });
  }

  const scales: number[] = [];
  if (width !== null) scales.push(width / source.width);
  if (height !== null) scales.push(height / source.height);

  if (scales.length === 0) return clamp(source);

  const scale = Math.min(...scales);
  return clamp({
    width: Math.round(source.width * scale),
    height: Math.round(source.height * scale),
  });
}

/** A zero-pixel image is not a picture, and no encoder accepts one. */
function clamp({ width, height }: Dimensions): Dimensions {
  return { width: Math.max(Math.round(width), 1), height: Math.max(Math.round(height), 1) };
}

/** Resizes one image, returning it encoded in the format it already was. */
export type ImageResizer = (image: SourceImage) => Promise<Uint8Array>;

export interface ResizeOutput {
  bytes: ArrayBuffer;
  kind: 'image' | 'zip';
  imageCount: number;
  /** The name of a single result, which keeps the format it came in as. */
  name?: string;
}

/**
 * Resizes a batch and packages it.
 *
 * Resizing is injected so the batching and the naming stay testable without a
 * canvas; the arithmetic that decides the new size is `targetSize`, tested on
 * its own.
 */
export async function resizeImages(
  images: SourceImage[],
  resize: ImageResizer,
  report: ProgressReporter,
): Promise<ResizeOutput> {
  if (images.length === 0) {
    throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');
  }

  const results: Array<{ entry: string; bytes: Uint8Array }> = [];
  const taken = new Set<string>();

  for (const [index, image] of images.entries()) {
    report(index / images.length, `Resizing ${image.name}`);

    results.push({
      // The format does not change, so neither does the name.
      entry: uniqueEntryName(taken, image.name),
      bytes: await resize(image),
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
