import { expose } from '@/workers/expose';
import { buildPdf, type BuildInput, type BuildOutput } from './build';

export type BuildPayload = BuildInput;
export type BuildResult = BuildOutput;

expose<BuildPayload, BuildResult>(
  (payload, { report }) => buildPdf(payload, report),
  (result) => [result.bytes],
);
