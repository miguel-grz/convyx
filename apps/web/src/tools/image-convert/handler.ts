import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';
import { FORMAT_MIME, type RasterFormat } from '@/lib/image/formats';
import type { ConvertPayload, ConvertResult } from './worker';

export interface ConvertOptions {
  format: RasterFormat;
  /** 0..1. Lossless formats ignore it. */
  quality: number;
}

const handler: ToolHandler<ConvertOptions> = async ({ files, options, signal, onProgress }) => {
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

  const result = await runInWorker<ConvertPayload, ConvertResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { images, format: options.format, quality: options.quality },
    { signal, onProgress, transfer: images.map((image) => image.bytes) },
  );

  const zipped = result.kind === 'zip';

  return {
    blob: new Blob([result.bytes], {
      type: zipped ? 'application/zip' : FORMAT_MIME[options.format],
    }),
    filename: zipped
      ? `images-${options.format}.zip`
      : `${stripExtension(first.name)}.${options.format}`,
  };
};

export default handler;
