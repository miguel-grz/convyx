import { type ToolHandler } from '@convyx/tool-contract';
import { runInWorker } from '@/workers/runInWorker';
import { stripExtension } from '@/lib/format';
import type { Orientation, PageSize } from './build';
import type { BuildPayload, BuildResult } from './worker';

export interface BuildOptions {
  size: PageSize;
  orientation: Orientation;
  margin: number;
}

const handler: ToolHandler<BuildOptions> = async ({ files, options, signal, onProgress }) => {
  onProgress(null, 'Reading your images');

  const images = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      bytes: await file.arrayBuffer(),
    })),
  );

  const result = await runInWorker<BuildPayload, BuildResult>(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    { images, size: options.size, orientation: options.orientation, margin: options.margin },
    { signal, onProgress, transfer: images.map((image) => image.bytes) },
  );

  const base = files.length === 1 && files[0] ? stripExtension(files[0].name) : 'images';

  return {
    blob: new Blob([result.bytes], { type: 'application/pdf' }),
    filename: `${base}.pdf`,
  };
};

export default handler;
