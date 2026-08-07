import { PDFDocument } from 'pdf-lib';
import type { ProgressReporter } from '@convyx/tool-contract';
import { loadPdf, savePdf } from '@/lib/pdf/load';
import { parsePageRanges, toPageIndices } from '@/lib/pageRanges';

export interface ExtractInput {
  name: string;
  bytes: ArrayBuffer;
  /** The raw field value, e.g. `1-3, 7, 12-`. Parsed here so errors name it. */
  pages: string;
}

export interface ExtractOutput {
  bytes: ArrayBuffer;
  pageCount: number;
}

/**
 * Copies the selected pages into a new document, in document order.
 *
 * Parsing happens here rather than in the UI so the range is validated against
 * the document that is actually being read, not against a page count the UI
 * fetched earlier and may have stale.
 */
export async function extractPages(
  { name, bytes, pages }: ExtractInput,
  report: ProgressReporter,
): Promise<ExtractOutput> {
  report(0.1, 'Opening the document');

  const source = await loadPdf(bytes, name);
  const ranges = parsePageRanges(pages, source.getPageCount());
  const indices = toPageIndices(ranges);

  report(0.4, `Copying ${indices.length} ${indices.length === 1 ? 'page' : 'pages'}`);

  const extracted = await PDFDocument.create();
  const copied = await extracted.copyPages(source, indices);
  for (const page of copied) extracted.addPage(page);

  report(0.9, 'Writing the new file');

  return { bytes: await savePdf(extracted), pageCount: extracted.getPageCount() };
}
