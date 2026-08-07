import type { ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';
import type { MergePayload, MergeResult } from './worker';

export interface MergeOptions {
  /** Base name for the download, without extension. */
  filename?: string;
}

const handler: ToolHandler<MergeOptions> = async ({ files, options, signal, onProgress }) => {
  onProgress(null, 'Loading your files');

  const documents = await Promise.all(
    files.map(async (file) => ({ name: file.name, bytes: await file.arrayBuffer() })),
  );

  const result = await runInWorker<MergePayload, MergeResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { documents },
    { signal, onProgress, transfer: documents.map((document) => document.bytes) },
  );

  const base = options.filename?.trim() || `${stripExtension(files[0]?.name ?? 'document')}-merged`;

  return {
    blob: new Blob([result.bytes], { type: 'application/pdf' }),
    filename: `${base}.pdf`,
  };
};

export default handler;
