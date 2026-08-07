import { PDFDocument } from 'pdf-lib';
import { ToolError } from '@convyx/tool-contract';

/**
 * Opens a PDF, turning pdf-lib's failures into ones a person can act on.
 *
 * pdf-lib throws the same opaque parse error for an encrypted file and a
 * truncated one. Telling them apart is the difference between a useful message
 * and a shrug, and every PDF tool needs the same distinction — so it is made
 * once, here.
 */
export async function loadPdf(bytes: ArrayBuffer, name: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.toLowerCase() : '';

    if (message.includes('encrypt')) {
      throw new ToolError('PASSWORD_REQUIRED', `“${name}” is password protected.`, {
        hint: 'Remove the password with Unlock PDF first, then try again.',
        cause,
      });
    }

    throw new ToolError('CORRUPT_FILE', `“${name}” could not be read as a PDF.`, {
      hint: 'Try repairing it, or export it again from the app that created it.',
      cause,
    });
  }
}

/**
 * pdf-lib writes into a pooled buffer; copying gives a standalone one that can
 * be transferred to the main thread instead of structured-cloned.
 */
export async function savePdf(document: PDFDocument): Promise<ArrayBuffer> {
  return new Uint8Array(await document.save({ useObjectStreams: true })).buffer;
}
