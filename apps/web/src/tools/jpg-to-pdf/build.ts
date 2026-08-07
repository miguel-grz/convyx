import { PDFDocument, type PDFImage } from 'pdf-lib';
import { ToolError, type ProgressReporter } from '@convyx/tool-contract';
import { savePdf } from '@/lib/pdf/load';

/** Sizes in PDF points, which is what pdf-lib measures pages in. */
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

export type PageSize = keyof typeof PAGE_SIZES | 'fit';
export type Orientation = 'portrait' | 'landscape' | 'auto';

export interface SourceImage {
  name: string;
  type: string;
  bytes: ArrayBuffer;
}

export interface BuildInput {
  images: SourceImage[];
  size: PageSize;
  orientation: Orientation;
  /** Points of white space around the image. Ignored when size is `fit`. */
  margin: number;
}

export interface BuildOutput {
  bytes: ArrayBuffer;
  pageCount: number;
}

/**
 * Puts each image on its own page, in the order given.
 *
 * `fit` makes every page exactly the size of its image, which is what people
 * expect from a scan or a screenshot — no white border, no letterboxing. The
 * fixed sizes centre the image and preserve its aspect ratio, because a photo
 * stretched to A4 is never the intent.
 */
export async function buildPdf(
  { images, size, orientation, margin }: BuildInput,
  report: ProgressReporter,
): Promise<BuildOutput> {
  if (images.length === 0) {
    throw new ToolError('TOO_FEW_FILES', 'Add at least one image.');
  }

  const pdf = await PDFDocument.create();

  for (const [index, image] of images.entries()) {
    report(index / images.length, `Adding ${image.name}`);

    const embedded = await embed(pdf, image);

    if (size === 'fit') {
      const page = pdf.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      continue;
    }

    const base = PAGE_SIZES[size];
    const landscape =
      orientation === 'landscape' || (orientation === 'auto' && embedded.width > embedded.height);

    const pageWidth = landscape ? base.height : base.width;
    const pageHeight = landscape ? base.width : base.height;
    const page = pdf.addPage([pageWidth, pageHeight]);

    // Contain rather than cover: the whole image has to be on the page.
    const usableWidth = Math.max(pageWidth - margin * 2, 1);
    const usableHeight = Math.max(pageHeight - margin * 2, 1);
    const scale = Math.min(usableWidth / embedded.width, usableHeight / embedded.height);

    const width = embedded.width * scale;
    const height = embedded.height * scale;

    page.drawImage(embedded, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    });
  }

  report(0.95, 'Writing the PDF');

  return { bytes: await savePdf(pdf), pageCount: pdf.getPageCount() };
}

/**
 * PDF can carry JPEG and PNG data directly, and nothing else. Anything the
 * dropzone let through that is neither is named rather than silently skipped.
 */
async function embed(pdf: PDFDocument, image: SourceImage): Promise<PDFImage> {
  const isPng = image.type === 'image/png' || image.name.toLowerCase().endsWith('.png');

  try {
    return isPng ? await pdf.embedPng(image.bytes) : await pdf.embedJpg(image.bytes);
  } catch (cause) {
    throw new ToolError('CORRUPT_FILE', `“${image.name}” could not be read as an image.`, {
      hint: 'A PDF can only carry JPG and PNG. Convert it first, then try again.',
      cause,
    });
  }
}
