import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { FORMAT_MIME, formatOf } from '@/lib/image/formats';
import type { Rect } from './crop';
import type { CropPayload, CropResult } from './worker';

export interface CropOptions {
  rect: Rect;
}

const handler: ToolHandler<CropOptions> = async ({ files, options, signal, onProgress }) => {
  const file = files[0];
  if (!file) throw new ToolError('TOO_FEW_FILES', 'Choose an image first.');

  onProgress(null, 'Reading your image');
  const bytes = await file.arrayBuffer();

  const result = await runInWorker<CropPayload, CropResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { name: file.name, type: file.type, bytes, rect: options.rect },
    { signal, onProgress, transfer: [bytes] },
  );

  const format = formatOf(file.name, file.type);

  return {
    blob: new Blob([result.bytes], { type: format ? FORMAT_MIME[format] : file.type }),
    filename: file.name,
    note: `Cropped to ${result.width} × ${result.height} pixels.`,
  };
};

export default handler;
