import { ToolError } from '@convyx/tool-contract';
import type { WorkerRequest, WorkerResponse } from './protocol';

interface WorkerContext {
  report: (value: number | null, label?: string) => void;
}

/**
 * The worker-side half of `runInWorker`. A tool's `worker.ts` is then just:
 *
 *   expose<Payload, Result>(async (payload, { report }) => { ... })
 *
 * Errors are converted to a `ToolError` payload here so the main thread always
 * receives a message that is safe to show to a person.
 */
export function expose<TPayload, TResult>(
  job: (payload: TPayload, context: WorkerContext) => Promise<TResult>,
  getTransfer?: (result: TResult) => Transferable[],
): void {
  const post = (message: WorkerResponse<TResult>, transfer: Transferable[] = []) => {
    self.postMessage(message, { transfer });
  };

  self.addEventListener('message', (event: MessageEvent<WorkerRequest<TPayload>>) => {
    void (async () => {
      try {
        const result = await job(event.data.payload, {
          report: (value, label) => post({ type: 'progress', value, label }),
        });

        post({ type: 'result', result }, getTransfer?.(result) ?? []);
      } catch (cause) {
        const error =
          cause instanceof ToolError
            ? cause
            : new ToolError('PROCESSING_FAILED', 'This file could not be processed.', {
                hint: 'It may be corrupt, encrypted, or in an unexpected format.',
              });

        post({ type: 'error', code: error.code, message: error.message, hint: error.hint });
      }
    })();
  });
}
