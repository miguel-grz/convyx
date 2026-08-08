import { ToolError } from '@convyx/tool-contract';
import { expose } from '@/workers/expose';
import { canEncode, decodeImage, encodeImage } from '@/lib/image/raster';
import { formatOf, isLossy } from '@/lib/image/formats';
import { rotateImages, type Orientation, type RotateOutput, type SourceImage } from './rotate';

export interface RotatePayload {
  images: SourceImage[];
  orientation: Orientation;
}

export type RotateResult = RotateOutput;

/**
 * A quarter turn moves whole pixels and loses nothing. Only the re-encode
 * costs anything, so it is kept high.
 */
const QUALITY = 0.92;

expose<RotatePayload, RotateResult>(
  async ({ images, orientation }, { report }) => {
    return rotateImages(
      images,
      async (image) => {
        const format = formatOf(image.name, image.type);

        // Turning keeps the format, so one this browser cannot write is a dead
        // end rather than something to silently swap.
        if (!format || !(await canEncode(format))) {
          throw new ToolError('PROCESSING_FAILED', `“${image.name}” cannot be turned here.`, {
            hint: 'Convert it to PNG or JPG first, then turn the result.',
          });
        }

        const bitmap = await decodeImage(image.bytes, image.name, image.type);

        try {
          return await encodeImage(bitmap, {
            format,
            quality: isLossy(format) ? QUALITY : 1,
            orientation,
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
