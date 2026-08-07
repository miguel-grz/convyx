import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';
import type { ImageFormat } from './renderer';
import type { ConvertPayload, ConvertResult } from './worker';

export interface ConvertOptions {
  pages: string;
  scale: number;
  format: ImageFormat;
  quality: number;
}

const MIME: Record<ImageFormat, string> = { jpg: 'image/jpeg', png: 'image/png' };

const handler: ToolHandler<ConvertOptions> = async ({ files, options, signal, onProgress }) => {
  const file = files[0];
  if (!file) throw new ToolError('TOO_FEW_FILES', 'Choose a PDF first.');

  onProgress(null, 'Reading your file');
  const bytes = await file.arrayBuffer();
  const baseName = stripExtension(file.name);

  const result = await runInWorker<ConvertPayload, ConvertResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { name: file.name, bytes, baseName, ...options },
    { signal, onProgress, transfer: [bytes] },
  );

  const zipped = result.kind === 'zip';

  return {
    blob: new Blob([result.bytes], { type: zipped ? 'application/zip' : MIME[options.format] }),
    filename: zipped ? `${baseName}-pages.zip` : `${baseName}.${options.format}`,
  };
};

export default handler;
