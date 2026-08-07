import { ToolError } from '@convyx/tool-contract';
import { expose } from '@/workers/expose';
import { canEncode, decodeImage, encodeImage } from '@/lib/image/raster';
import { formatOf, isLossy } from '@/lib/image/formats';
import { resizeImages, targetSize, type ResizeOutput, type ResizeSpec } from './resize';
import type { SourceImage } from './resize';

export interface ResizePayload {
  images: SourceImage[];
  spec: ResizeSpec;
}

export type ResizeResult = ResizeOutput;

/**
 * High enough that a resized photo is not visibly worse than its source. This
 * tool changes dimensions; losing quality on top of that would be a second
 * change nobody asked for.
 */
const QUALITY = 0.92;

expose<ResizePayload, ResizeResult>(
  async ({ images, spec }, { report }) => {
    return resizeImages(
      images,
      async (image) => {
        const format = formatOf(image.name, image.type);

        // Resizing keeps the format, so a format this browser cannot write is a
        // dead end rather than something to work around silently.
        if (!format || !(await canEncode(format))) {
          throw new ToolError('PROCESSING_FAILED', `“${image.name}” cannot be resized here.`, {
            hint: 'Convert it to PNG or JPG first, then resize the result.',
          });
        }

        const bitmap = await decodeImage(image.bytes, image.name, image.type);

        try {
          const size = targetSize({ width: bitmap.width, height: bitmap.height }, spec);
          return await encodeImage(bitmap, {
            format,
            quality: isLossy(format) ? QUALITY : 1,
            ...size,
          });
        } finally {
          bitmap.close();
        }
      },
      report,
    );
  },
  (result) => [result.bytes],
);
