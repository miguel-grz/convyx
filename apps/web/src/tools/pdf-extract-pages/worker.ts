import { expose } from '@/workers/expose';
import { extractPages, type ExtractInput, type ExtractOutput } from './extract';

export type ExtractPayload = ExtractInput;
export type ExtractResult = ExtractOutput;

expose<ExtractPayload, ExtractResult>(
  (payload, { report }) => extractPages(payload, report),
  (result) => [result.bytes],
);
