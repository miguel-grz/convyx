import { PDFDocument } from 'pdf-lib';
import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import { loadPdf, savePdf } from '@/lib/pdf/load';

export interface OrganizeInput {
  name: string;
  bytes: ArrayBuffer;
  /** 1-based page numbers, in the order they should appear. */
  order: number[];
}

export interface OrganizeOutput {
  bytes: ArrayBuffer;
  pageCount: number;
}

/**
 * Rebuilds a document from a page order.
 *
 * Reordering and deleting are the same operation seen from two sides: the new
 * document is whatever the order lists, so a page left out is a page deleted.
 * One code path, and no way for the two to disagree.
 */
export async function organizePdf(
  { name, bytes, order }: OrganizeInput,
  report: ProgressReporter,
): Promise<OrganizeOutput> {
  report(0.1, 'Opening the document');

  const source = await loadPdf(bytes, name);
  const pageCount = source.getPageCount();

  if (order.length === 0) {
    throw new ToolError('PROCESSING_FAILED', 'You have removed every page.', {
      hint: 'Keep at least one page, or start over.',
    });
  }

  const seen = new Set<number>();
  for (const pageNumber of order) {
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount) {
      throw new ToolError('PROCESSING_FAILED', `Page ${pageNumber} is not in this document.`, {
        hint: `It has ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}.`,
      });
    }

    if (seen.has(pageNumber)) {
      throw new ToolError('PROCESSING_FAILED', `Page ${pageNumber} is listed twice.`);
    }

    seen.add(pageNumber);
  }

  report(0.4, `Rebuilding with ${order.length} ${order.length === 1 ? 'page' : 'pages'}`);

  const rebuilt = await PDFDocument.create();
  const copied = await rebuilt.copyPages(
    source,
    order.map((pageNumber) => pageNumber - 1),
  );
  for (const page of copied) rebuilt.addPage(page);

  report(0.9, 'Writing the file');

  return { bytes: await savePdf(rebuilt), pageCount: rebuilt.getPageCount() };
}
