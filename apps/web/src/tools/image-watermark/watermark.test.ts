import { describe, expect, it, vi } from 'vitest';
import { unzipSync } from 'fflate';
import { rejectsWithToolError } from '@/test/toolError';
import { placeMark, watermarkImages, type SourceImage } from './watermark';

const image = { width: 1000, height: 600 };
const mark = { width: 200, height: 100 };
const base = { scale: 0.2, margin: 0.05 } as const;

describe('placeMark', () => {
  it('sizes the mark as a share of the image, keeping its shape', () => {
    const rect = placeMark(image, mark, { ...base, anchor: 'top-left' });

    expect(rect.width).toBe(200);
    expect(rect.height).toBe(100);
  });

  it('gives the same relative mark to images of different sizes', () => {
    const big = placeMark({ width: 4000, height: 2400 }, mark, { ...base, anchor: 'top-left' });
    const small = placeMark({ width: 400, height: 240 }, mark, { ...base, anchor: 'top-left' });

    expect(big.width / 4000).toBeCloseTo(small.width / 400, 5);
    expect(big.x / 4000).toBeCloseTo(small.x / 400, 5);
  });

  it('puts each corner where its name says', () => {
    const at = (anchor: Parameters<typeof placeMark>[2]['anchor']) =>
      placeMark(image, mark, { ...base, anchor });

    expect(at('top-left')).toMatchObject({ x: 50, y: 50 });
    expect(at('top-right')).toMatchObject({ x: 750, y: 50 });
    expect(at('bottom-left')).toMatchObject({ x: 50, y: 450 });
    expect(at('bottom-right')).toMatchObject({ x: 750, y: 450 });
  });

  it('centres on the axis an edge anchor does not pin', () => {
    expect(placeMark(image, mark, { ...base, anchor: 'top' })).toMatchObject({ x: 400, y: 50 });
    expect(placeMark(image, mark, { ...base, anchor: 'left' })).toMatchObject({ x: 50, y: 250 });
  });

  it('ignores the margin in the middle, because the middle is the middle', () => {
    const tight = placeMark(image, mark, { scale: 0.2, margin: 0, anchor: 'center' });
    const loose = placeMark(image, mark, { scale: 0.2, margin: 0.2, anchor: 'center' });

    expect(tight).toEqual(loose);
    expect(tight).toMatchObject({ x: 400, y: 250 });
  });

  it('shrinks a mark too tall for the space rather than letting it hang off', () => {
    // A tall mark at 90% of a short image's width would not fit between the
    // margins, so the height is what decides the size.
    const tall = { width: 100, height: 400 };
    const rect = placeMark(image, tall, { scale: 0.9, margin: 0.05, anchor: 'top-left' });

    expect(rect.height).toBeLessThanOrEqual(600 - 50 * 2);
    expect(rect.y + rect.height).toBeLessThanOrEqual(600);
    // The shape survives the shrink.
    expect(rect.height / rect.width).toBeCloseTo(4, 1);
  });

  it('never places the mark outside the image', () => {
    for (const anchor of ['top-left', 'bottom-right', 'center'] as const) {
      const rect = placeMark(image, mark, { scale: 1, margin: 0.4, anchor });

      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(image.width);
      expect(rect.y + rect.height).toBeLessThanOrEqual(image.height);
    }
  });

  it('keeps a side of at least one pixel', () => {
    const rect = placeMark(image, mark, { scale: 0, margin: 0, anchor: 'center' });

    expect(rect.width).toBeGreaterThanOrEqual(1);
    expect(rect.height).toBeGreaterThanOrEqual(1);
  });
});

function source(name: string, type = 'image/jpeg'): SourceImage {
  return { name, type, bytes: new ArrayBuffer(8) };
}

const stamper = (item: SourceImage) =>
  Promise.resolve(new TextEncoder().encode(`stamped:${item.name}`));

describe('watermarkImages', () => {
  it('returns the image itself when there is only one', async () => {
    const result = await watermarkImages([source('photo.jpg')], stamper, vi.fn());

    expect(result.kind).toBe('image');
    expect(result.name).toBe('photo.jpg');
    expect(new TextDecoder().decode(result.bytes)).toBe('stamped:photo.jpg');
  });

  it('keeps every name, because stamping does not change the format', async () => {
    const result = await watermarkImages(
      [source('a.jpg'), source('b.png', 'image/png')],
      stamper,
      vi.fn(),
    );

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))).toEqual(['a.jpg', 'b.png']);
  });

  it('renames rather than overwrites when two sources share a name', async () => {
    const result = await watermarkImages([source('img.jpg'), source('img.jpg')], stamper, vi.fn());

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))).toEqual(['img.jpg', 'img-2.jpg']);
  });

  it('needs at least one image', async () => {
    const error = await rejectsWithToolError(watermarkImages([], stamper, vi.fn()));

    expect(error.code).toBe('TOO_FEW_FILES');
  });

  it('reports progress that only moves forward', async () => {
    const report = vi.fn();
    await watermarkImages([source('a.jpg'), source('b.jpg'), source('c.jpg')], stamper, report);

    const values = report.mock.calls.map(([value]) => value as number);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});
