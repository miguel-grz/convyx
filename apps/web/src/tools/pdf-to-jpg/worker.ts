import { expose } from '@/workers/expose';
import { convertToImages, type ConvertOutput } from './convert';
import { openForRender, type ImageFormat } from './renderer';

export interface ConvertPayload {
  name: string;
  bytes: ArrayBuffer;
  baseName: string;
  pages: string;
  /** 1 renders at the page's own size; 2 doubles it, and so on. */
  scale: number;
  format: ImageFormat;
  quality: number;
}

export type ConvertResult = ConvertOutput;

expose<ConvertPayload, ConvertResult>(
  async ({ name, bytes, baseName, pages, scale, format, quality }, { report }) => {
    report(0.02, 'Opening the document');

    const target = await openForRender(bytes, name, { scale, format, quality });

    try {
      return await convertToImages(
        { pageCount: target.pageCount, pages, baseName, extension: format },
        target.render,
        report,
      );
    } finally {
      // pdf.js holds the parsed document and its worker until told otherwise,
      // and the thread outlives the document, so this is awaited in order.
      await target.destroy();
    }
  },
  (result) => [result.bytes],
);
