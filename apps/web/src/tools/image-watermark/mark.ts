import { ToolError } from '@convyx/tool-contract';
import { decodeImage } from '@/lib/image/raster';

export interface TextMark {
  kind: 'text';
  text: string;
  colour: 'white' | 'black';
}

export interface LogoMark {
  kind: 'logo';
  name: string;
  type: string;
  bytes: ArrayBuffer;
}

export type MarkSpec = TextMark | LogoMark;

/**
 * Drawn once at this size and scaled down onto each image, rather than redrawn
 * per image. Text scaled down from here is sharp on anything smaller than a
 * poster, and it means the batch measures the mark once.
 */
const TEXT_SIZE = 220;

/**
 * Turns the mark into something drawable, whatever kind it is.
 *
 * Text and a logo become the same thing here — a picture with a width and a
 * height — so everything downstream has one case to handle instead of two.
 * Where it goes is `placeMark`, which does not care which of the two it got.
 */
export async function renderMark(spec: MarkSpec): Promise<ImageBitmap | OffscreenCanvas> {
  if (spec.kind === 'logo') {
    return decodeImage(spec.bytes, spec.name, spec.type);
  }

  if (typeof OffscreenCanvas === 'undefined') {
    throw new ToolError('PROCESSING_FAILED', 'This browser cannot draw a text watermark.', {
      hint: 'Try a recent version of Chrome, Edge, Firefox or Safari.',
    });
  }

  const font = `bold ${TEXT_SIZE}px sans-serif`;

  const ruler = new OffscreenCanvas(1, 1).getContext('2d');
  if (!ruler) {
    throw new ToolError('PROCESSING_FAILED', 'This browser cannot draw a text watermark.');
  }

  ruler.font = font;
  const metrics = ruler.measureText(spec.text);

  // Ascent and descent rather than the font's line height: a watermark should
  // sit tight around its own letters, not around the space a line of text would
  // occupy, or the gap above it reads as a misplaced mark.
  const ascent = metrics.actualBoundingBoxAscent || TEXT_SIZE * 0.75;
  const descent = metrics.actualBoundingBoxDescent || TEXT_SIZE * 0.25;
  const pad = Math.round(TEXT_SIZE * 0.12);

  const canvas = new OffscreenCanvas(
    Math.max(Math.ceil(metrics.width) + pad * 2, 1),
    Math.max(Math.ceil(ascent + descent) + pad * 2, 1),
  );

  const context = canvas.getContext('2d');
  if (!context) {
    throw new ToolError('PROCESSING_FAILED', 'This browser cannot draw a text watermark.');
  }

  context.font = font;
  context.textBaseline = 'alphabetic';

  // A watermark lands on a photo nobody chose for it. White text disappears
  // into a bright sky and black text into a shadow, so the letters carry a thin
  // outline of the opposite colour — enough to stay readable on either without
  // reading as a second colour.
  context.lineWidth = TEXT_SIZE * 0.055;
  context.lineJoin = 'round';
  context.strokeStyle = spec.colour === 'white' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)';
  context.strokeText(spec.text, pad, pad + ascent);

  context.fillStyle = spec.colour === 'white' ? '#ffffff' : '#000000';
  context.fillText(spec.text, pad, pad + ascent);

  return canvas;
}

/** The size of whatever `renderMark` handed back. */
export function markSize(mark: ImageBitmap | OffscreenCanvas): { width: number; height: number } {
  return { width: mark.width, height: mark.height };
}
