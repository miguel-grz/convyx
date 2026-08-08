import { ToolError, type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { FORMAT_MIME, formatOf } from '@/lib/image/formats';
import { isUpright, type Orientation } from './rotate';
import type { RotatePayload, RotateResult } from './worker';

export interface RotateOptions {
  orientation: Orientation;
}

const handler: ToolHandler<RotateOptions> = async ({ files, options, signal, onProgress }) => {
  const first = files[0];
  if (!first) throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');

  // Nothing to do is worth saying out loud. Silently handing back a re-encoded
  // copy of what they already had would look like the tool worked.
  if (isUpright(options.orientation)) {
    throw new ToolError('PROCESSING_FAILED', 'Choose a turn or a flip first.', {
      hint: 'These images are already the way up they would come back.',
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

  const result = await runInWorker<RotatePayload, RotateResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { images, orientation: options.orientation },
    { signal, onProgress, transfer: images.map((image) => image.bytes) },
  );

  if (result.kind === 'zip') {
    return {
      blob: new Blob([result.bytes], { type: 'application/zip' }),
      filename: 'turned-images.zip',
    };
  }

  const format = formatOf(first.name, first.type);

  return {
    blob: new Blob([result.bytes], { type: format ? FORMAT_MIME[format] : first.type }),
    filename: result.name ?? first.name,
  };
};

export default handler;
