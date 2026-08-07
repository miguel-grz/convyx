import { PDFDocument } from 'pdf-lib';
import { expose } from './expose';

export interface DocumentInfoPayload {
  name: string;
  bytes: ArrayBuffer;
}

export interface DocumentInfo {
  pageCount: number;
}

/**
 * Reads what the UI needs to know before a run: how many pages there are, so a
 * page-range field can say "of 40" and validate before the user commits.
 *
 * Shared rather than per-tool, and off the main thread because parsing a 100 MB
 * document is not free — a tool page must not stutter just because a file was
 * dropped on it.
 *
 * Encryption is tolerated here. A protected file still reports its page count,
 * and the real failure is raised by the run itself, with the message and the
 * recovery hint that belong to it.
 */
expose<DocumentInfoPayload, DocumentInfo>(async ({ bytes }) => {
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return { pageCount: document.getPageCount() };
});
