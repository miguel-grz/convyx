import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { FORMAT_MIME, formatOf } from '@/lib/image/formats';
import type { ResizeSpec } from './resize';
import type { ResizePayload, ResizeResult } from './worker';

export interface ResizeOptions {
  spec: ResizeSpec;
}

const handler: ToolHandler<ResizeOptions> = async ({ files, options, signal, onProgress }) => {
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

  const result = await runInWorker<ResizePayload, ResizeResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { images, spec: options.spec },
    { signal, onProgress, transfer: images.map((image) => image.bytes) },
  );

  if (result.kind === 'zip') {
    return {
      blob: new Blob([result.bytes], { type: 'application/zip' }),
      filename: 'resized-images.zip',
    };
  }

  const format = formatOf(first.name, first.type);

  return {
    blob: new Blob([result.bytes], { type: format ? FORMAT_MIME[format] : first.type }),
    filename: result.name ?? first.name,
  };
};

export default handler;
