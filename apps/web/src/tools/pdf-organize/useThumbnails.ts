import { useEffect, useState } from 'react';
import type { ToolErrorPayload } from '@convyx/tool-contract';
import { toToolError } from '@/lib/validation';
import { runInWorker } from '@/workers/runInWorker';
import type { ThumbnailsPayload, ThumbnailsResult } from './thumbnails.worker';

export interface PagePreview {
  pageNumber: number;
  url: string;
  width: number;
  height: number;
}

interface ThumbnailsState {
  pages: PagePreview[];
  progress: number | null;
  loading: boolean;
  error: ToolErrorPayload | null;
}

const IDLE: ThumbnailsState = { pages: [], progress: null, loading: false, error: null };

/**
 * Renders every page to a preview as soon as a file is chosen.
 *
 * Object URLs are revoked when the file changes or the page unmounts. A
 * hundred-page document is a hundred blobs held open, and a tool people use
 * repeatedly would leak all of them.
 */
export function useThumbnails(file: File | null | undefined): ThumbnailsState {
  const [state, setState] = useState<ThumbnailsState>(IDLE);

  useEffect(() => {
    if (!file) {
      setState(IDLE);
      return;
    }

    const controller = new AbortController();
    let current = true;
    let created: string[] = [];

    setState({ pages: [], progress: null, loading: true, error: null });

    void (async () => {
      try {
        const bytes = await file.arrayBuffer();

        const result = await runInWorker<ThumbnailsPayload, ThumbnailsResult>(
          () => new Worker(new URL('./thumbnails.worker.ts', import.meta.url), { type: 'module' }),
          { name: file.name, bytes },
          {
            signal: controller.signal,
            onProgress: (value) => {
              if (current) setState((previous) => ({ ...previous, progress: value }));
            },
            transfer: [bytes],
          },
        );

        if (!current) return;

        created = result.pages.map((page) => URL.createObjectURL(new Blob([page.bytes])));

        setState({
          pages: result.pages.map((page, index) => ({
            pageNumber: page.pageNumber,
            url: created[index] ?? '',
            width: page.width,
            height: page.height,
          })),
          progress: 1,
          loading: false,
          error: null,
        });
      } catch (cause) {
        const error = toToolError(cause);
        if (!current || error.code === 'CANCELLED') return;
        setState({ pages: [], progress: null, loading: false, error: error.toPayload() });
      }
    })();

    return () => {
      current = false;
      controller.abort();
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [file]);

  return state;
}
