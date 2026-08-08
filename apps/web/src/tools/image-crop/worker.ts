import { ToolError } from '@convyx/tool-contract';
import { expose } from '@/workers/expose';
import { canEncode, decodeImage, encodeImage } from '@/lib/image/raster';
import { formatOf, isLossy } from '@/lib/image/formats';
import { fitRect, type Rect } from './crop';

export interface CropPayload {
  name: string;
  type: string;
  bytes: ArrayBuffer;
  /** In source pixels, as the preview measured them. */
  rect: Rect;
}

export interface CropResult {
  bytes: ArrayBuffer;
  width: number;
  height: number;
}

/** Cropping does not resample, so this only pays for the re-encode. */
const QUALITY = 0.92;

expose<CropPayload, CropResult>(
  async ({ name, type, bytes, rect }, { report }) => {
    report(0.05, 'Opening the image');

    const format = formatOf(name, type);

    // The crop keeps the format, so one this browser cannot write is a dead end
    // rather than something to silently swap.
    if (!format || !(await canEncode(format))) {
      throw new ToolError('PROCESSING_FAILED', `“${name}” cannot be cropped here.`, {
        hint: 'Convert it to PNG or JPG first, then crop the result.',
      });
    }

    const bitmap = await decodeImage(bytes, name, type);

    try {
      // The preview measured the image too, but a selection that came from a
      // stale measurement would cut the wrong rectangle. This is the only
      // reading that matters, so the selection is fitted to it again.
      const source = fitRect(rect, { width: bitmap.width, height: bitmap.height }, null);

      report(0.4, 'Cropping');

      const output = await encodeImage(bitmap, {
        format,
        quality: isLossy(format) ? QUALITY : 1,
        source,
      });

      return {
        bytes: output.buffer,
        width: source.width,
        height: source.height,
      };
    } finally {
      bitmap.close();
    }
  },
  (result) => [result.bytes],
);
