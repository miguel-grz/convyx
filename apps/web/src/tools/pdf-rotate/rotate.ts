import { degrees } from 'pdf-lib';
import type { ProgressReporter } from '@convyx/tool-contract';
import { loadPdf, savePdf } from '@/lib/pdf/load';
import { parsePageRanges, toPageIndices } from '@/lib/pageRanges';

/** Quarter turns clockwise. Anything else is not a rotation people ask for. */
export type RotationAngle = 90 | 180 | 270;

export interface RotateInput {
  name: string;
  bytes: ArrayBuffer;
  angle: RotationAngle;
  /** Empty means every page. */
  pages: string;
}

export interface RotateOutput {
  bytes: ArrayBuffer;
  rotatedCount: number;
}

/**
 * Turns pages, adding to whatever rotation the page already carries.
 *
 * Scans commonly arrive with a rotation already set, so replacing it would make
 * "rotate 90°" mean different things depending on the file. Adding is what the
 * button says it does.
 */
export async function rotatePdf(
  { name, bytes, angle, pages }: RotateInput,
  report: ProgressReporter,
): Promise<RotateOutput> {
  report(0.1, 'Opening the document');

  const document = await loadPdf(bytes, name);
  const all = document.getPages();

  const targets = pages.trim()
    ? toPageIndices(parsePageRanges(pages, all.length))
    : all.map((_, index) => index);

  report(0.5, `Turning ${targets.length} ${targets.length === 1 ? 'page' : 'pages'}`);

  for (const index of targets) {
    const page = all[index];
    if (!page) continue;

    // pdf-lib only accepts multiples of 90, and negatives are not normalised.
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }

  report(0.9, 'Writing the file');

  return { bytes: await savePdf(document), rotatedCount: targets.length };
}
