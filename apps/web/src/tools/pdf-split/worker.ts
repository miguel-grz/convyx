import { expose } from '@/workers/expose';
import { splitPdf, type SplitInput, type SplitOutput } from './split';

export type SplitPayload = SplitInput;
export type SplitResult = SplitOutput;

expose<SplitPayload, SplitResult>(
  (payload, { report }) => splitPdf(payload, report),
  (result) => [result.bytes],
);
