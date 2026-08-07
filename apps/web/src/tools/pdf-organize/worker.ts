import { expose } from '@/workers/expose';
import { organizePdf, type OrganizeInput, type OrganizeOutput } from './organize';

export type OrganizePayload = OrganizeInput;
export type OrganizeResult = OrganizeOutput;

expose<OrganizePayload, OrganizeResult>(
  (payload, { report }) => organizePdf(payload, report),
  (result) => [result.bytes],
);
