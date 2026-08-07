import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import { parsePageRanges, toPageIndices } from '@/lib/pageRanges';
import { safeEntryName, zipEntries } from '@/lib/zip';

/** Renders one page (1-based) to encoded image bytes. */
export type PageRenderer = (pageNumber: number) => Promise<Uint8Array>;

export interface ConvertInput {
  pageCount: number;
  /** Empty means every page. */
  pages: string;
  baseName: string;
  extension: 'jpg' | 'png';
}

export interface ConvertOutput {
  bytes: ArrayBuffer;
  kind: 'image' | 'zip';
  imageCount: number;
}

/**
 * Turns the selected pages into images and packages them.
 *
 * Rendering is injected rather than imported so this can be tested without a
 * canvas: node has no `OffscreenCanvas`, and the part worth testing here is the
 * page selection, the ordering, the naming and the single-versus-zip decision —
 * none of which involve pixels.
 *
 * A one-page document returns the image itself; a zip holding one file would be
 * an obstacle, not a delivery.
 */
export async function convertToImages(
  { pageCount, pages, baseName, extension }: ConvertInput,
  render: PageRenderer,
  report: ProgressReporter,
): Promise<ConvertOutput> {
  const targets = pages.trim()
    ? toPageIndices(parsePageRanges(pages, pageCount)).map((index) => index + 1)
    : Array.from({ length: pageCount }, (_, index) => index + 1);

  if (targets.length === 0) {
    throw new ToolError('PROCESSING_FAILED', 'That selection covers no pages.');
  }

  const rendered: Array<{ entry: string; bytes: Uint8Array }> = [];
  const width = String(pageCount).length;

  for (const [index, pageNumber] of targets.entries()) {
    report(index / targets.length, `Rendering page ${pageNumber} of ${pageCount}`);

    rendered.push({
      // Zero-padded so the files sort correctly in every file manager.
      entry: safeEntryName(`${baseName}-${String(pageNumber).padStart(width, '0')}.${extension}`),
      bytes: await render(pageNumber),
    });
  }

  const single = rendered[0];
  if (rendered.length === 1 && single) {
    return {
      bytes: single.bytes.slice().buffer as ArrayBuffer,
      kind: 'image',
      imageCount: 1,
    };
  }

  report(0.97, 'Bundling the images');

  return {
    bytes: zipEntries(Object.fromEntries(rendered.map((item) => [item.entry, item.bytes]))),
    kind: 'zip',
    imageCount: rendered.length,
  };
}
