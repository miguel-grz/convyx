import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import type { WorkerResponse } from './protocol';

interface RunInWorkerOptions {
  signal: AbortSignal;
  onProgress: ProgressReporter;
  /** Buffers to hand over instead of copying — usually the file bytes. */
  transfer?: Transferable[];
}

/**
 * Runs one job in a dedicated worker and tears it down afterwards.
 *
 * Heavy client-side work must not block the main thread (a 200 MB merge would
 * freeze the tab for seconds). A worker per run costs a few milliseconds of
 * startup and buys real cancellation: aborting terminates the thread outright,
 * even if the handler is deep inside a synchronous WASM call.
 */
export function runInWorker<TPayload, TResult>(
  createWorker: () => Worker,
  payload: TPayload,
  { signal, onProgress, transfer = [] }: RunInWorkerOptions,
): Promise<TResult> {
  return new Promise<TResult>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const worker = createWorker();

    const cleanup = () => {
      signal.removeEventListener('abort', onAbort);
      worker.terminate();
    };

    function onAbort() {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    }

    signal.addEventListener('abort', onAbort, { once: true });

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse<TResult>>) => {
      const message = event.data;

      switch (message.type) {
        case 'progress':
          onProgress(message.value, message.label);
          break;
        case 'result':
          cleanup();
          resolve(message.result);
          break;
        case 'error':
          cleanup();
          reject(new ToolError(message.code, message.message, { hint: message.hint }));
          break;
      }
    });

    // Fires for syntax errors and uncaught throws inside the worker — without
    // this the promise would hang forever.
    worker.addEventListener('error', (event) => {
      cleanup();
      reject(
        new ToolError('PROCESSING_FAILED', 'This file could not be processed.', {
          hint: 'It may be corrupt or in an unexpected format.',
          cause: event.message,
        }),
      );
    });

    worker.postMessage({ payload }, transfer);
  });
}
