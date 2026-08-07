import { PDFDocument } from 'pdf-lib';
import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import { loadPdf, savePdf } from '@/lib/pdf/load';
import { formatRange, parsePageRanges, type PageRange } from '@/lib/pageRanges';
import { safeEntryName, zipEntries } from '@/lib/zip';

export type SplitMode = 'ranges' | 'every-page';

export interface SplitInput {
  name: string;
  bytes: ArrayBuffer;
  mode: SplitMode;
  /** Used when `mode` is `ranges`, e.g. `1-3, 4-8, 9-`. */
  ranges: string;
  /** Base name for the produced documents, without extension. */
  baseName: string;
}

export interface SplitOutput {
  /** A single PDF when one document came out, a zip when several did. */
  bytes: ArrayBuffer;
  kind: 'pdf' | 'zip';
  documentCount: number;
}

/**
 * Cuts a document into several, either at ranges the user wrote or one file per
 * page.
 *
 * A split that produces one document returns that document, not a zip
 * containing it — asking someone to unpack an archive to reach a single PDF is
 * a worse outcome than the one they started with.
 */
export async function splitPdf(
  { name, bytes, mode, ranges, baseName }: SplitInput,
  report: ProgressReporter,
): Promise<SplitOutput> {
  report(0.05, 'Opening the document');

  const source = await loadPdf(bytes, name);
  const pageCount = source.getPageCount();

  const parts: PageRange[] =
    mode === 'every-page'
      ? Array.from({ length: pageCount }, (_, index) => ({ start: index + 1, end: index + 1 }))
      : parsePageRanges(ranges, pageCount);

  if (mode === 'every-page' && pageCount < 2) {
    throw new ToolError('PROCESSING_FAILED', 'This document only has one page.', {
      hint: 'There is nothing to split — the file you have is already that page.',
    });
  }

  const documents: Array<{ entry: string; bytes: ArrayBuffer }> = [];

  for (const [index, part] of parts.entries()) {
    report(0.1 + (index / parts.length) * 0.8, `Writing part ${index + 1} of ${parts.length}`);

    const indices = Array.from({ length: part.end - part.start + 1 }, (_, i) => part.start - 1 + i);

    const piece = await PDFDocument.create();
    const copied = await piece.copyPages(source, indices);
    for (const page of copied) piece.addPage(page);

    documents.push({
      entry: safeEntryName(`${baseName}-${formatRange(part)}.pdf`),
      bytes: await savePdf(piece),
    });
  }

  const single = documents[0];
  if (documents.length === 1 && single) {
    return { bytes: single.bytes, kind: 'pdf', documentCount: 1 };
  }

  report(0.95, 'Bundling the files');

  return {
    bytes: zipEntries(
      Object.fromEntries(documents.map((doc) => [doc.entry, new Uint8Array(doc.bytes)])),
    ),
    kind: 'zip',
    documentCount: documents.length,
  };
}
