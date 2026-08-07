import { expose } from '@/workers/expose';
import { canEncode, decodeImage, encodeImage } from '@/lib/image/raster';
import type { RasterFormat } from '@/lib/image/formats';
import { compressImages, type CompressOutput, type SourceImage } from './compress';

export interface CompressPayload {
  images: SourceImage[];
  /** `null` keeps every image in the format it already is. */
  format: RasterFormat | null;
  /** 0..1. */
  quality: number;
}

export type CompressResult = CompressOutput;

expose<CompressPayload, CompressResult>(
  async ({ images, format, quality }, { report }) => {
    return compressImages(
      { images, format },
      async (image, target) => {
        // Asked per format rather than once, because keeping each image's own
        // format means the batch can span several of them.
        if (!(await canEncode(target))) return null;

        const bitmap = await decodeImage(image.bytes, image.name, image.type);

        try {
          return await encodeImage(bitmap, { format: target, quality });
        } finally {
          bitmap.close();
        }
      },
      report,
    );
  },
  (result) => [result.bytes],
);
