import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import { stripExtension } from '@/lib/format';
import { safeEntryName, zipEntries } from '@/lib/zip';
import type { RasterFormat } from '@/lib/image/formats';

export interface SourceImage {
  name: string;
  type: string;
  bytes: ArrayBuffer;
}

/** Turns one source image into encoded bytes in the target format. */
export type ImageEncoder = (image: SourceImage) => Promise<Uint8Array>;

export interface ConvertInput {
  images: SourceImage[];
  format: RasterFormat;
}

export interface ConvertOutput {
  bytes: ArrayBuffer;
  kind: 'image' | 'zip';
  imageCount: number;
}

/**
 * Converts a batch and packages it.
 *
 * Encoding is injected rather than imported so this can be tested without a
 * canvas: node has no `OffscreenCanvas`, and what is worth testing here is the
 * naming, the collision handling and the single-versus-zip decision — none of
 * which involve pixels.
 *
 * One image comes back as itself. A zip holding a single file is an obstacle
 * between the person and their result, not a delivery.
 */
export async function convertImages(
  { images, format }: ConvertInput,
  encode: ImageEncoder,
  report: ProgressReporter,
): Promise<ConvertOutput> {
  if (images.length === 0) {
    throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');
  }

  const converted: Array<{ entry: string; bytes: Uint8Array }> = [];
  const taken = new Set<string>();

  for (const [index, image] of images.entries()) {
    report(index / images.length, `Converting ${image.name}`);

    converted.push({
      entry: uniqueName(taken, safeEntryName(`${stripExtension(image.name)}.${format}`)),
      bytes: await encode(image),
    });
  }

  const single = converted[0];
  if (converted.length === 1 && single) {
    return { bytes: single.bytes.slice().buffer as ArrayBuffer, kind: 'image', imageCount: 1 };
  }

  report(0.97, 'Bundling the images');

  return {
    bytes: zipEntries(Object.fromEntries(converted.map((item) => [item.entry, item.bytes]))),
    kind: 'zip',
    imageCount: converted.length,
  };
}

/**
 * Converting `logo.png` and `logo.jpg` in one go would produce two `logo.webp`
 * entries, and the second would quietly replace the first inside the zip. The
 * suffix keeps both, and keeps them recognisable.
 */
function uniqueName(taken: Set<string>, name: string): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : '';

  let candidate = name;
  let counter = 2;

  while (taken.has(candidate)) {
    candidate = `${stem}-${counter}${extension}`;
    counter += 1;
  }

  taken.add(candidate);
  return candidate;
}
