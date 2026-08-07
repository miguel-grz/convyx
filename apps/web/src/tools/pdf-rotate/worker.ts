import { expose } from '@/workers/expose';
import { rotatePdf, type RotateInput, type RotateOutput } from './rotate';

export type RotatePayload = RotateInput;
export type RotateResult = RotateOutput;

expose<RotatePayload, RotateResult>(
  (payload, { report }) => rotatePdf(payload, report),
  (result) => [result.bytes],
);
