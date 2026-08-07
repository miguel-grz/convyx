import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ToolError } from '@convyx/tool-contract';
import { PDFJS_ASSETS } from '@/lib/pdf/pdfjsAssets';
import type { PageRenderer } from './convert';

// pdf.js parses and rasterises in a worker of its own. We are already inside
// one, so this is a nested worker — supported everywhere we target, and worth
// it: parsing a large document would otherwise block our own progress reports.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type ImageFormat = 'jpg' | 'png';

export interface RenderTarget {
  pageCount: number;
  render: PageRenderer;
  destroy: () => void;
}

/**
 * Opens a document and hands back a renderer for its pages.
 *
 * Rasterising needs a canvas, and a worker only has `OffscreenCanvas`. Where it
 * is missing the failure is named up front rather than surfacing as a null
 * context deep inside pdf.js.
 */
export async function openForRender(
  bytes: ArrayBuffer,
  name: string,
  { scale, format, quality }: { scale: number; format: ImageFormat; quality: number },
): Promise<RenderTarget> {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new ToolError('PROCESSING_FAILED', 'This browser cannot render PDF pages to images.', {
      hint: 'Try a recent version of Chrome, Edge, Firefox or Safari.',
    });
  }

  // The loading task owns the pdf.js worker; the document proxy does not. Only
  // the task can shut it down, so it has to outlive the await.
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

    throw new ToolError('CORRUPT_FILE', `“${name}” could not be read as a PDF.`, {
      hint: 'Try repairing it, or export it again from the app that created it.',
      cause,
    });
  }

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';

  const render: PageRenderer = async (pageNumber) => {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    if (!context) throw new ToolError('PROCESSING_FAILED', 'This page could not be drawn.');

    // PDF pages are transparent by default; without this, every JPEG comes out
    // with a black background instead of the white paper people expect.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // pdf.js types its render target as the DOM canvas, but it accepts an
    // OffscreenCanvas and that is the only kind a worker has. Naming the DOM
    // types here would not compile — this module is only ever reached from a
    // worker, where they do not exist — so the cast goes through the signature.
    type RenderParameters = Parameters<typeof page.render>[0];
    await page.render({ canvas, canvasContext: context, viewport } as unknown as RenderParameters)
      .promise;

    page.cleanup();

    const blob = await canvas.convertToBlob({ type: mimeType, quality });
    return new Uint8Array(await blob.arrayBuffer());
  };

  return {
    pageCount: document.numPages,
    render,
    destroy: () => void task.destroy(),
  };
}
