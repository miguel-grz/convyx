import { ToolError } from '@convyx/tool-contract';
import { expose } from '@/workers/expose';
import { canEncode, decodeImage, encodeImage } from '@/lib/image/raster';
import { formatOf, isLossy } from '@/lib/image/formats';
import { markSize, renderMark, type MarkSpec } from './mark';
import {
  placeMark,
  watermarkImages,
  type Placement,
  type SourceImage,
  type WatermarkOutput,
} from './watermark';

export interface WatermarkPayload {
  images: SourceImage[];
  mark: MarkSpec;
  placement: Placement;
  /** 0..1. */
  opacity: number;
}

export type WatermarkResult = WatermarkOutput;

/** Stamping does not resample the photo, so only the re-encode costs anything. */
const QUALITY = 0.92;

expose<WatermarkPayload, WatermarkResult>(
  async ({ images, mark, placement, opacity }, { report }) => {
    report(0.02, 'Preparing the watermark');

    // Rendered once for the whole batch: it is the same mark on every image,
    // only scaled differently.
    const rendered = await renderMark(mark);
    const size = markSize(rendered);

    return watermarkImages(
      images,
      async (image) => {
        const format = formatOf(image.name, image.type);

        // Stamping keeps the format, so one this browser cannot write is a dead
        // end rather than something to silently swap.
        if (!format || !(await canEncode(format))) {
          throw new ToolError('PROCESSING_FAILED', `“${image.name}” cannot be stamped here.`, {
            hint: 'Convert it to PNG or JPG first, then add the watermark.',
          });
        }

        const bitmap = await decodeImage(image.bytes, image.name, image.type);

        try {
          const at = placeMark({ width: bitmap.width, height: bitmap.height }, size, placement);

          return await encodeImage(bitmap, {
            format,
            quality: isLossy(format) ? QUALITY : 1,
            stamps: [{ image: rendered, ...at, opacity }],
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
