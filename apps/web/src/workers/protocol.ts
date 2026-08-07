import type { ToolErrorCode } from '@convyx/tool-contract';

/**
 * The message shapes exchanged with a tool worker.
 *
 * Deliberately hand-rolled rather than pulled from Comlink: the surface is one
 * request and three replies, and owning it means cancellation can be a plain
 * `terminate()` instead of cooperative polling inside every handler.
 */

export interface WorkerRequest<TPayload> {
  payload: TPayload;
}

export type WorkerResponse<TResult> =
  | { type: 'progress'; value: number | null; label?: string }
  | { type: 'result'; result: TResult }
  | { type: 'error'; code: ToolErrorCode; message: string; hint?: string };
