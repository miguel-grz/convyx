import { useEffect, useState } from 'react';
import { toToolError } from '@/lib/validation';
import { runInWorker } from '@/workers/runInWorker';
import type { DocumentInfo, DocumentInfoPayload } from '@/workers/document.worker';

interface PageCountState {
  pageCount: number | null;
  loading: boolean;
  /** Only set when the file is unreadable — the run will say so properly. */
  failed: boolean;
}

/**
 * Reads a PDF's page count as soon as one is chosen.
 *
 * A page-range field is close to unusable without it: "which pages?" is an
 * unanswerable question when you cannot see how many there are, and validating
 * only on submit means finding out after the work.
 *
 * Superseded results are dropped rather than raced — pick a second file quickly
 * and the first reply must not overwrite the second.
 */
export function usePageCount(file: File | null | undefined): PageCountState {
  const [state, setState] = useState<PageCountState>({
    pageCount: null,
    loading: false,
    failed: false,
  });

  useEffect(() => {
    if (!file) {
      setState({ pageCount: null, loading: false, failed: false });
      return;
    }

    const controller = new AbortController();
    let current = true;

    setState({ pageCount: null, loading: true, failed: false });

    void (async () => {
      try {
        const bytes = await file.arrayBuffer();

        const info = await runInWorker<DocumentInfoPayload, DocumentInfo>(
          () =>
            new Worker(new URL('../workers/document.worker.ts', import.meta.url), {
              type: 'module',
            }),
          { name: file.name, bytes },
          { signal: controller.signal, onProgress: () => {}, transfer: [bytes] },
        );

        if (current) setState({ pageCount: info.pageCount, loading: false, failed: false });
      } catch (cause) {
        if (!current || toToolError(cause).code === 'CANCELLED') return;
        setState({ pageCount: null, loading: false, failed: true });
      }
    })();

    return () => {
      current = false;
      controller.abort();
    };
  }, [file]);

  return state;
}
