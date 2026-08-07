import { expose } from '@/workers/expose';
import { decodeImage, encodeImage, requireEncoder } from '@/lib/image/raster';
import type { RasterFormat } from '@/lib/image/formats';
import { convertImages, type ConvertOutput, type SourceImage } from './convert';

export interface ConvertPayload {
  images: SourceImage[];
  format: RasterFormat;
  /** 0..1. Lossless formats ignore it. */
  quality: number;
}

export type ConvertResult = ConvertOutput;

expose<ConvertPayload, ConvertResult>(
  async ({ images, format, quality }, { report }) => {
    report(0.02, 'Getting ready');

    // Asked before any decoding: finding out the encoder is missing after
    // chewing through twenty photos wastes the person's time.
    await requireEncoder(format);

    return convertImages(
      { images, format },
      async (image) => {
        const bitmap = await decodeImage(image.bytes, image.name, image.type);

        try {
          return await encodeImage(bitmap, { format, quality });
        } finally {
          // A bitmap holds its decoded pixels until it is closed, and a batch of
          // phone photos is hundreds of megabytes of them.
          bitmap.close();
        }
      },
      report,
    );
  },
  (result) => [result.bytes],
);
