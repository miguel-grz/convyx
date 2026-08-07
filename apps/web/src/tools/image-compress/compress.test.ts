import { describe, expect, it, vi } from 'vitest';
import { unzipSync } from 'fflate';
import { rejectsWithToolError } from '@/test/toolError';
import { compressImages, type CompressEncoder, type SourceImage } from './compress';

function source(name: string, size: number, type = 'image/jpeg'): SourceImage {
  return { name, type, bytes: new Uint8Array(size).fill(1).buffer };
}

/** Halves the input, which is what compressing is supposed to do. */
const shrinks: CompressEncoder = (image) =>
  Promise.resolve(new Uint8Array(image.bytes.byteLength / 2).fill(2));

/** Comes back bigger, which is what an already-optimised file does. */
const grows: CompressEncoder = (image) =>
  Promise.resolve(new Uint8Array(image.bytes.byteLength * 2).fill(3));

describe('compressImages', () => {
  it('returns the image itself when there is only one', async () => {
    const result = await compressImages(
      { images: [source('photo.jpg', 800)], format: null },
      shrinks,
      vi.fn(),
    );

    expect(result.kind).toBe('image');
    expect(result.name).toBe('photo.jpg');
    expect(result.bytes.byteLength).toBe(400);
    expect(result.keptCount).toBe(0);
  });

  it('keeps the original when re-encoding made it bigger', async () => {
    const result = await compressImages(
      { images: [source('already-tiny.png', 300, 'image/png')], format: null },
      grows,
      vi.fn(),
    );

    expect(result.bytes.byteLength).toBe(300);
    expect(result.keptCount).toBe(1);
    expect(new Uint8Array(result.bytes)[0]).toBe(1);
  });

  it('counts only the files it had to leave alone', async () => {
    const mixed: CompressEncoder = (image) =>
      image.name.startsWith('big')
        ? Promise.resolve(new Uint8Array(100))
        : Promise.resolve(new Uint8Array(9000));

    const result = await compressImages(
      {
        images: [source('big-1.jpg', 5000), source('small.jpg', 400), source('big-2.jpg', 5000)],
        format: null,
      },
      mixed,
      vi.fn(),
    );

    expect(result.keptCount).toBe(1);
    expect(result.imageCount).toBe(3);
  });

  it('renames to the target format, and leaves kept files as they were', async () => {
    const onlyPhotos: CompressEncoder = (image) =>
      image.name.endsWith('.png')
        ? Promise.resolve(new Uint8Array(image.bytes.byteLength * 2))
        : Promise.resolve(new Uint8Array(200));

    const result = await compressImages(
      { images: [source('shot.jpg', 4000), source('icon.png', 500, 'image/png')], format: 'webp' },
      onlyPhotos,
      vi.fn(),
    );

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))).toEqual(['shot.webp', 'icon.png']);
  });

  it('leaves a file alone when the browser cannot write its format', async () => {
    const noEncoder: CompressEncoder = () => Promise.resolve(null);

    const result = await compressImages(
      { images: [source('shot.avif', 4000, 'image/avif')], format: null },
      noEncoder,
      vi.fn(),
    );

    expect(result.name).toBe('shot.avif');
    expect(result.keptCount).toBe(1);
    expect(result.bytes.byteLength).toBe(4000);
  });

  it('leaves a file alone when neither its type nor its name says what it is', async () => {
    const encode = vi.fn(shrinks);

    const result = await compressImages(
      { images: [{ name: 'scan', type: '', bytes: new ArrayBuffer(600) }], format: null },
      encode,
      vi.fn(),
    );

    expect(encode).not.toHaveBeenCalled();
    expect(result.keptCount).toBe(1);
  });

  it('renames rather than overwrites when two sources collide', async () => {
    const result = await compressImages(
      { images: [source('logo.png', 900, 'image/png'), source('logo.jpg', 900)], format: 'webp' },
      shrinks,
      vi.fn(),
    );

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))).toEqual([
      'logo.webp',
      'logo-2.webp',
    ]);
  });

  it('needs at least one image', async () => {
    const error = await rejectsWithToolError(
      compressImages({ images: [], format: null }, shrinks, vi.fn()),
    );

    expect(error.code).toBe('TOO_FEW_FILES');
  });

  it('reports progress that only moves forward', async () => {
    const report = vi.fn();
    await compressImages(
      { images: [source('a.jpg', 400), source('b.jpg', 400), source('c.jpg', 400)], format: null },
      shrinks,
      report,
    );

    const values = report.mock.calls.map(([value]) => value as number);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});
