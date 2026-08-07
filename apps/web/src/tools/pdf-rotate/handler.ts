import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';
import type { RotationAngle } from './rotate';
import type { RotatePayload, RotateResult } from './worker';

export interface RotateOptions {
  angle: RotationAngle;
  pages: string;
}

const handler: ToolHandler<RotateOptions> = async ({ files, options, signal, onProgress }) => {
  const file = files[0];
  if (!file) throw new ToolError('TOO_FEW_FILES', 'Choose a PDF first.');

  onProgress(null, 'Reading your file');
  const bytes = await file.arrayBuffer();

  const result = await runInWorker<RotatePayload, RotateResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { name: file.name, bytes, angle: options.angle, pages: options.pages },
    { signal, onProgress, transfer: [bytes] },
  );

  return {
    blob: new Blob([result.bytes], { type: 'application/pdf' }),
    filename: `${stripExtension(file.name)}-rotated.pdf`,
  };
};

export default handler;
