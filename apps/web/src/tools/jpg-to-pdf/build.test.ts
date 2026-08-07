import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { rejectsWithToolError } from '@/test/toolError';
import { buildPdf, type SourceImage } from './build';

/** A real PNG, since pdf-lib parses the header rather than trusting the name. */
async function png(width: number, height: number, name = 'shot.png'): Promise<SourceImage> {
  const document = await PDFDocument.create();
  document.addPage([width, height]);
  // pdf-lib cannot rasterise, so build the PNG bytes directly instead.
  const raw = makePng(width, height);
  return { name, type: 'image/png', bytes: raw };
}

/** Minimal uncompressed-ish PNG: header, IHDR, one IDAT, IEND. */
function makePng(width: number, height: number): ArrayBuffer {
  const chunks: number[] = [137, 80, 78, 71, 13, 10, 26, 10];

  const chunk = (type: string, data: number[]) => {
    const length = data.length;
    chunks.push((length >>> 24) & 255, (length >>> 16) & 255, (length >>> 8) & 255, length & 255);
    const body = [...type].map((character) => character.charCodeAt(0)).concat(data);
    chunks.push(...body);
    const crc = crc32(body);
    chunks.push((crc >>> 24) & 255, (crc >>> 16) & 255, (crc >>> 8) & 255, crc & 255);
  };

  chunk('IHDR', [
    (width >>> 24) & 255,
    (width >>> 16) & 255,
    (width >>> 8) & 255,
    width & 255,
    (height >>> 24) & 255,
    (height >>> 16) & 255,
    (height >>> 8) & 255,
    height & 255,
    8,
    0,
    0,
    0,
    0,
  ]);

  // One zlib stream of `height` scanlines, each a filter byte plus `width` bytes.
  const raw: number[] = [];
  for (let row = 0; row < height; row += 1) raw.push(0, ...new Array<number>(width).fill(200));
  chunk('IDAT', deflateStored(raw));
  chunk('IEND', []);

  return new Uint8Array(chunks).buffer;
}

function deflateStored(data: number[]): number[] {
  const out = [0x78, 0x01];
  for (let index = 0; index < data.length; index += 65535) {
    const block = data.slice(index, index + 65535);
    const last = index + 65535 >= data.length ? 1 : 0;
    out.push(
      last,
      block.length & 255,
      (block.length >>> 8) & 255,
      ~block.length & 255,
      (~block.length >>> 8) & 255,
      ...block,
    );
  }
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  out.push((b >>> 8) & 255, b & 255, (a >>> 8) & 255, a & 255);
  return out;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes: number[]): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 255]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function pagesOf(bytes: ArrayBuffer) {
  const document = await PDFDocument.load(bytes);
  return document.getPages().map((page) => ({
    width: Math.round(page.getWidth()),
    height: Math.round(page.getHeight()),
  }));
}

const options = { size: 'fit' as const, orientation: 'auto' as const, margin: 0 };

describe('buildPdf', () => {
  it('gives each image its own page', async () => {
    const result = await buildPdf(
      { ...options, images: [await png(120, 90), await png(60, 200)] },
      vi.fn(),
    );

    expect(result.pageCount).toBe(2);
  });

  it('fits the page to the image when asked to', async () => {
    const result = await buildPdf({ ...options, images: [await png(120, 90)] }, vi.fn());
    expect(await pagesOf(result.bytes)).toEqual([{ width: 120, height: 90 }]);
  });

  it('uses A4 portrait for a tall image on auto', async () => {
    const result = await buildPdf(
      { images: [await png(60, 200)], size: 'a4', orientation: 'auto', margin: 0 },
      vi.fn(),
    );

    expect(await pagesOf(result.bytes)).toEqual([{ width: 595, height: 842 }]);
  });

  it('turns A4 on its side for a wide image on auto', async () => {
    const result = await buildPdf(
      { images: [await png(200, 60)], size: 'a4', orientation: 'auto', margin: 0 },
      vi.fn(),
    );

    expect(await pagesOf(result.bytes)).toEqual([{ width: 842, height: 595 }]);
  });

  it('honours a forced orientation over the image shape', async () => {
    const result = await buildPdf(
      { images: [await png(200, 60)], size: 'letter', orientation: 'portrait', margin: 0 },
      vi.fn(),
    );

    expect(await pagesOf(result.bytes)).toEqual([{ width: 612, height: 792 }]);
  });

  it('refuses an empty selection', async () => {
    const error = await rejectsWithToolError(buildPdf({ ...options, images: [] }, vi.fn()));
    expect(error.code).toBe('TOO_FEW_FILES');
  });

  it('names the image it could not read', async () => {
    const error = await rejectsWithToolError(
      buildPdf(
        {
          ...options,
          images: [
            { name: 'broken.png', type: 'image/png', bytes: new Uint8Array([1, 2, 3]).buffer },
          ],
        },
        vi.fn(),
      ),
    );

    expect(error.code).toBe('CORRUPT_FILE');
    expect(error.message).toContain('broken.png');
  });
});
