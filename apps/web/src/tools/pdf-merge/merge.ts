import { PDFDocument } from 'pdf-lib';
import { ToolError, type ProgressReporter } from '@convyx/tool-contract';

export interface SourceDocument {
  name: string;
  bytes: ArrayBuffer;
}

export interface MergeOutput {
  bytes: ArrayBuffer;
  pageCount: number;
}

/**
 * The actual work, with no reference to workers or the DOM.
 *
 * Keeping it pure is what makes it testable: the suite runs this directly on
 * real PDFs, while `worker.ts` is a three-line shell that wires it to a thread.
 * Every client-side tool should split the same way.
 */
export async function mergeDocuments(
  documents: SourceDocument[],
  report: ProgressReporter,
): Promise<MergeOutput> {
  if (documents.length < 2) {
    throw new ToolError('TOO_FEW_FILES', 'Merging needs at least two PDFs.');
  }

  const merged = await PDFDocument.create();

  for (let index = 0; index < documents.length; index += 1) {
    const document = documents[index];
    if (!document) continue;

    report(index / documents.length, `Reading ${document.name}`);

    const source = await loadDocument(document);
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }

  report(0.95, 'Writing the merged file');

  const saved = await merged.save({ useObjectStreams: true });

  return {
    // pdf-lib writes into a pooled buffer; copy into a standalone one so it can
    // be transferred to the main thread instead of structured-cloned.
    bytes: new Uint8Array(saved).buffer,
    pageCount: merged.getPageCount(),
  };
}

/**
 * pdf-lib throws the same opaque parse error for an encrypted file and a
 * truncated one. Telling them apart is the difference between a useful message
 * and a shrug, so the distinction is made here rather than left to the UI.
 */
async function loadDocument({ name, bytes }: SourceDocument): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.toLowerCase() : '';

    if (message.includes('encrypt')) {
      throw new ToolError('PASSWORD_REQUIRED', `“${name}” is password protected.`, {
        hint: 'Remove the password with Unlock PDF first, then merge.',
        cause,
      });
    }

    throw new ToolError('CORRUPT_FILE', `“${name}” could not be read as a PDF.`, {
      hint: 'Try repairing it, or export it again from the app that created it.',
      cause,
    });
  }
}
