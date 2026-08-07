import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import { stripExtension } from '@/lib/format';
import { uniqueEntryName, zipEntries } from '@/lib/zip';
import { formatOf, type RasterFormat } from '@/lib/image/formats';

export interface SourceImage {
  name: string;
  type: string;
  bytes: ArrayBuffer;
}

/**
 * Re-encodes one image in the given format. Returns `null` when this browser
 * cannot write that format, which is not a failure — it means leave the file
 * alone.
 */
export type CompressEncoder = (
  image: SourceImage,
  format: RasterFormat,
) => Promise<Uint8Array | null>;

export interface CompressInput {
  images: SourceImage[];
  /** `null` keeps every image in the format it already is. */
  format: RasterFormat | null;
}

export interface CompressOutput {
  bytes: ArrayBuffer;
  kind: 'image' | 'zip';
  imageCount: number;
  /** How many came back untouched because re-encoding did not make them smaller. */
  keptCount: number;
  /**
   * The name of a single result. Set here rather than worked out again by the
   * handler, because only this function knows whether the file was replaced or
   * kept, and the two answers have different extensions.
   */
  name?: string;
}

/**
 * Compresses a batch, and never hands back a file that grew.
 *
 * That guarantee is the whole tool. Re-encoding is not monotonic: a PNG that
 * was already optimised, or a JPEG saved at a lower quality than the one asked
 * for, comes out bigger than it went in. Shipping that would break the one
 * promise the name makes, so the original is kept instead and the result says
 * how many that happened to.
 *
 * Encoding is injected so the batching, the naming and the keep-or-replace
 * decision stay testable without a canvas.
 */
export async function compressImages(
  { images, format }: CompressInput,
  encode: CompressEncoder,
  report: ProgressReporter,
): Promise<CompressOutput> {
  if (images.length === 0) {
    throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');
  }

  const results: Array<{ entry: string; bytes: Uint8Array }> = [];
  const taken = new Set<string>();
  let keptCount = 0;

  for (const [index, image] of images.entries()) {
    report(index / images.length, `Compressing ${image.name}`);

    const original = new Uint8Array(image.bytes);
    const target = format ?? formatOf(image.name, image.type);
    const encoded = target ? await encode(image, target) : null;
    const smaller = encoded !== null && encoded.length < original.length;

    if (!smaller) keptCount += 1;

    results.push({
      entry: uniqueEntryName(
        taken,
        smaller ? `${stripExtension(image.name)}.${target ?? ''}` : image.name,
      ),
      bytes: smaller && encoded ? encoded : original,
    });
  }

  const single = results[0];
  if (results.length === 1 && single) {
    return {
      bytes: single.bytes.slice().buffer as ArrayBuffer,
      kind: 'image',
      imageCount: 1,
      keptCount,
      name: single.entry,
    };
  }

  report(0.97, 'Bundling the images');

  return {
    bytes: zipEntries(Object.fromEntries(results.map((item) => [item.entry, item.bytes]))),
    kind: 'zip',
    imageCount: results.length,
    keptCount,
  };
}
