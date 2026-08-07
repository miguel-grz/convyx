import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';
import type { ExtractPayload, ExtractResult } from './worker';

export interface ExtractOptions {
  pages: string;
}

const handler: ToolHandler<ExtractOptions> = async ({ files, options, signal, onProgress }) => {
  const file = files[0];
  if (!file) throw new ToolError('TOO_FEW_FILES', 'Choose a PDF first.');

  onProgress(null, 'Reading your file');
  const bytes = await file.arrayBuffer();

  const result = await runInWorker<ExtractPayload, ExtractResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { name: file.name, bytes, pages: options.pages },
    { signal, onProgress, transfer: [bytes] },
  );

  return {
    blob: new Blob([result.bytes], { type: 'application/pdf' }),
    filename: `${stripExtension(file.name)}-pages.pdf`,
  };
};

export default handler;
