import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ToolError } from '@convyx/tool-contract';
import { PDFJS_ASSETS } from '@/lib/pdf/pdfjsAssets';
import { expose } from '@/workers/expose';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** Wide enough to recognise a page, small enough to hold a hundred in memory. */
const THUMBNAIL_WIDTH = 200;

export interface ThumbnailsPayload {
  name: string;
  bytes: ArrayBuffer;
}

export interface Thumbnail {
  pageNumber: number;
  bytes: ArrayBuffer;
  width: number;
  height: number;
}

export interface ThumbnailsResult {
  pages: Thumbnail[];
}

/**
 * Draws every page small.
 *
 * Reordering pages you cannot see is guesswork, so this runs as soon as a file
 * is chosen rather than at submit. Each page is rendered at a fixed width and
 * released immediately — a 200-page document would otherwise hold 200 full-size
 * bitmaps at once.
 */
expose<ThumbnailsPayload, ThumbnailsResult>(
  async ({ name, bytes }, { report }) => {
    if (typeof OffscreenCanvas === 'undefined') {
      throw new ToolError('PROCESSING_FAILED', 'This browser cannot draw page previews.', {
        hint: 'Try a recent version of Chrome, Edge, Firefox or Safari.',
      });
    }

    const task = pdfjs.getDocument({ data: new Uint8Array(bytes), ...PDFJS_ASSETS });

    let document;
    try {
      document = await task.promise;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message.toLowerCase() : '';

      if (message.includes('password')) {
        throw new ToolError('PASSWORD_REQUIRED', `“${name}” is password protected.`, {
          hint: 'Remove the password with Unlock PDF first, then try again.',
          cause,
        });
      }

      throw new ToolError('CORRUPT_FILE', `“${name}” could not be read as a PDF.`, { cause });
    }

    try {
      const pages: Thumbnail[] = [];

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        report(pageNumber / document.numPages, `Drawing page ${pageNumber}`);

        const page = await document.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: THUMBNAIL_WIDTH / base.width });

        const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const context = canvas.getContext('2d');
        if (!context) throw new ToolError('PROCESSING_FAILED', 'A page could not be drawn.');

        // PDF pages are transparent; without this the previews come out black.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        type RenderParameters = Parameters<typeof page.render>[0];
        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        } as unknown as RenderParameters).promise;

        page.cleanup();

        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.72 });
        pages.push({
          pageNumber,
          bytes: await blob.arrayBuffer(),
          width: canvas.width,
          height: canvas.height,
        });
      }

      return { pages };
    } finally {
      void task.destroy();
    }
  },
  (result) => result.pages.map((page) => page.bytes),
);
