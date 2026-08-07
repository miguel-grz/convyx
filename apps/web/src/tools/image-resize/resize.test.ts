import { describe, expect, it, vi } from 'vitest';
import { unzipSync } from 'fflate';
import { rejectsWithToolError } from '@/test/toolError';
import { resizeImages, targetSize, type SourceImage } from './resize';

const landscape = { width: 1200, height: 800 };
const portrait = { width: 800, height: 1200 };

describe('targetSize', () => {
  it('scales both sides by the percentage', () => {
    expect(targetSize(landscape, { mode: 'percent', percent: 25 })).toEqual({
      width: 300,
      height: 200,
    });
  });

  it('rounds to whole pixels rather than leaving a fraction', () => {
    expect(targetSize({ width: 101, height: 33 }, { mode: 'percent', percent: 50 })).toEqual({
      width: 51,
      height: 17,
    });
  });

  it('never returns a side smaller than one pixel', () => {
    expect(targetSize({ width: 10, height: 4 }, { mode: 'percent', percent: 1 })).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('derives the other side when only one is given', () => {
    const spec = { mode: 'pixels', width: 600, height: null, keepAspect: true } as const;
    expect(targetSize(landscape, spec)).toEqual({ width: 600, height: 400 });
  });

  it('fits inside the box when both are given, without stretching', () => {
    const spec = { mode: 'pixels', width: 1000, height: 1000, keepAspect: true } as const;

    expect(targetSize(landscape, spec)).toEqual({ width: 1000, height: 667 });
    expect(targetSize(portrait, spec)).toEqual({ width: 667, height: 1000 });
  });

  it('takes both sides literally when the ratio is unlocked', () => {
    const spec = { mode: 'pixels', width: 500, height: 500, keepAspect: false } as const;
    expect(targetSize(landscape, spec)).toEqual({ width: 500, height: 500 });
  });

  it('keeps the side that was left blank when the ratio is unlocked', () => {
    const spec = { mode: 'pixels', width: 400, height: null, keepAspect: false } as const;
    expect(targetSize(landscape, spec)).toEqual({ width: 400, height: 800 });
  });

  it('leaves the image alone when no dimension was given at all', () => {
    const spec = { mode: 'pixels', width: null, height: null, keepAspect: true } as const;
    expect(targetSize(landscape, spec)).toEqual(landscape);
  });

  it('enlarges when the box is bigger than the image', () => {
    const spec = { mode: 'pixels', width: 2400, height: null, keepAspect: true } as const;
    expect(targetSize(landscape, spec)).toEqual({ width: 2400, height: 1600 });
  });
});

function source(name: string, type = 'image/jpeg'): SourceImage {
  return { name, type, bytes: new ArrayBuffer(8) };
}

const resizer = (image: SourceImage) =>
  Promise.resolve(new TextEncoder().encode(`resized:${image.name}`));

describe('resizeImages', () => {
  it('returns the image itself when there is only one', async () => {
    const result = await resizeImages([source('photo.jpg')], resizer, vi.fn());

    expect(result.kind).toBe('image');
    expect(result.name).toBe('photo.jpg');
    expect(new TextDecoder().decode(result.bytes)).toBe('resized:photo.jpg');
  });

  it('keeps every name, because resizing does not change the format', async () => {
    const result = await resizeImages(
      [source('a.jpg'), source('b.png', 'image/png')],
      resizer,
      vi.fn(),
    );

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))).toEqual(['a.jpg', 'b.png']);
  });

  it('renames rather than overwrites when two sources share a name', async () => {
    const result = await resizeImages([source('shot.jpg'), source('shot.jpg')], resizer, vi.fn());

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))).toEqual([
      'shot.jpg',
      'shot-2.jpg',
    ]);
  });

  it('needs at least one image', async () => {
    const error = await rejectsWithToolError(resizeImages([], resizer, vi.fn()));

    expect(error.code).toBe('TOO_FEW_FILES');
  });

  it('reports progress that only moves forward', async () => {
    const report = vi.fn();
    await resizeImages([source('a.jpg'), source('b.jpg'), source('c.jpg')], resizer, report);

    const values = report.mock.calls.map(([value]) => value as number);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});
