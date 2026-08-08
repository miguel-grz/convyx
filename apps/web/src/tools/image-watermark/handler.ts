import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { FORMAT_MIME, formatOf } from '@/lib/image/formats';
import type { MarkSpec } from './mark';
import type { Placement } from './watermark';
import type { WatermarkPayload, WatermarkResult } from './worker';

export interface WatermarkOptions {
  mark: MarkSpec;
  placement: Placement;
  /** 0..1. */
  opacity: number;
}

const handler: ToolHandler<WatermarkOptions> = async ({ files, options, signal, onProgress }) => {
  const first = files[0];
  if (!first) throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');

  if (options.mark.kind === 'text' && options.mark.text.trim() === '') {
    throw new ToolError('PROCESSING_FAILED', 'Write the text for the watermark first.', {
      hint: 'Or switch to a logo and choose an image.',
    });
  }

  onProgress(null, 'Reading your images');

  const images = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      bytes: await file.arrayBuffer(),
    })),
  );

  const result = await runInWorker<WatermarkPayload, WatermarkResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { images, mark: options.mark, placement: options.placement, opacity: options.opacity },
    // The image bytes are read fresh for this run and can be handed over. A
    // logo's are not: they are held in the page between runs, and transferring
    // them would empty the buffer and break the second run with a file that
    // looks perfectly fine on screen.
    { signal, onProgress, transfer: images.map((image) => image.bytes) },
  );

  if (result.kind === 'zip') {
    return {
      blob: new Blob([result.bytes], { type: 'application/zip' }),
      filename: 'watermarked-images.zip',
    };
  }

  const format = formatOf(first.name, first.type);

  return {
    blob: new Blob([result.bytes], { type: format ? FORMAT_MIME[format] : first.type }),
    filename: result.name ?? first.name,
  };
};

export default handler;
