import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';
import type { OrganizePayload, OrganizeResult } from './worker';

export interface OrganizeOptions {
  order: number[];
}

const handler: ToolHandler<OrganizeOptions> = async ({ files, options, signal, onProgress }) => {
  const file = files[0];
  if (!file) throw new ToolError('TOO_FEW_FILES', 'Choose a PDF first.');

  onProgress(null, 'Reading your file');
  const bytes = await file.arrayBuffer();

  const result = await runInWorker<OrganizePayload, OrganizeResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { name: file.name, bytes, order: options.order },
    { signal, onProgress, transfer: [bytes] },
  );

  return {
    blob: new Blob([result.bytes], { type: 'application/pdf' }),
    filename: `${stripExtension(file.name)}-organized.pdf`,
  };
};

export default handler;
