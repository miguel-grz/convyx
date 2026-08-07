import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { FORMAT_MIME, formatOf, type RasterFormat } from '@/lib/image/formats';
import type { CompressPayload, CompressResult } from './worker';

export interface CompressOptions {
  /** `null` keeps every image in the format it already is. */
  format: RasterFormat | null;
  /** 0..1. */
  quality: number;
}

const handler: ToolHandler<CompressOptions> = async ({ files, options, signal, onProgress }) => {
  const first = files[0];
  if (!first) throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');

  onProgress(null, 'Reading your images');

  const images = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      bytes: await file.arrayBuffer(),
    })),
  );

  const result = await runInWorker<CompressPayload, CompressResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { images, format: options.format, quality: options.quality },
    { signal, onProgress, transfer: images.map((image) => image.bytes) },
  );

  const zipped = result.kind === 'zip';
  const filename = zipped ? 'compressed-images.zip' : (result.name ?? first.name);

  return {
    blob: new Blob([result.bytes], {
      type: zipped ? 'application/zip' : mimeOf(filename, first.type),
    }),
    filename,
    note: noteFor(result.keptCount, result.imageCount),
  };
};

function mimeOf(filename: string, fallback: string): string {
  const format = formatOf(filename);
  return format ? FORMAT_MIME[format] : fallback;
}

/**
 * Kept files are the one outcome a size on its own cannot explain: the result
 * panel would show 0% smaller with nothing to say why.
 */
function noteFor(kept: number, total: number): string | undefined {
  if (kept === 0) return undefined;

  if (kept === total) {
    return total === 1
      ? 'This image was already as small as it can get at this quality, so it comes back unchanged.'
      : 'These images were already as small as they can get at this quality, so they come back unchanged.';
  }

  return `${kept} of ${total} were already as small as they can get, so they come back unchanged.`;
}

export default handler;
