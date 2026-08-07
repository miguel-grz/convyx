import { expose } from '@/workers/expose';
import { mergeDocuments, type MergeOutput, type SourceDocument } from './merge';

export interface MergePayload {
  /** Files already read into transferable buffers, in the order to merge. */
  documents: SourceDocument[];
}

export type MergeResult = MergeOutput;

/**
 * The worker is only a thread boundary. All of the logic lives in `merge.ts` so
 * it can be tested without spinning up a worker.
 */
expose<MergePayload, MergeResult>(
  ({ documents }, { report }) => mergeDocuments(documents, report),
  (result) => [result.bytes],
);
