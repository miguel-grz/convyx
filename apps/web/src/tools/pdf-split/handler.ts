import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';
import type { SplitMode } from './split';
import type { SplitPayload, SplitResult } from './worker';

export interface SplitOptions {
  mode: SplitMode;
  ranges: string;
}

const handler: ToolHandler<SplitOptions> = async ({ files, options, signal, onProgress }) => {
  const file = files[0];
  if (!file) throw new ToolError('TOO_FEW_FILES', 'Choose a PDF first.');

  onProgress(null, 'Reading your file');
  const bytes = await file.arrayBuffer();
  const baseName = stripExtension(file.name);

  const result = await runInWorker<SplitPayload, SplitResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { name: file.name, bytes, mode: options.mode, ranges: options.ranges, baseName },
    { signal, onProgress, transfer: [bytes] },
  );

  // One document comes back as itself; several arrive bundled.
  const zipped = result.kind === 'zip';

  return {
    blob: new Blob([result.bytes], { type: zipped ? 'application/zip' : 'application/pdf' }),
    filename: zipped ? `${baseName}-split.zip` : `${baseName}-split.pdf`,
  };
};

export default handler;
