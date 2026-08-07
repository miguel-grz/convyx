import { describe, expect, it, vi } from 'vitest';
import { unzipSync } from 'fflate';
import { rejectsWithToolError } from '@/test/toolError';
import { convertImages, type ImageEncoder, type SourceImage } from './convert';

function source(name: string, type = 'image/png'): SourceImage {
  return { name, type, bytes: new ArrayBuffer(4) };
}

/** Encodes the source name into the bytes, so each output is identifiable. */
const encoder: ImageEncoder = (image) =>
  Promise.resolve(new TextEncoder().encode(`encoded:${image.name}`));

function names(bytes: ArrayBuffer): string[] {
  return Object.keys(unzipSync(new Uint8Array(bytes)));
}

describe('convertImages', () => {
  it('returns the image itself when there is only one', async () => {
    const result = await convertImages(
      { images: [source('photo.png')], format: 'webp' },
      encoder,
      vi.fn(),
    );

    expect(result.kind).toBe('image');
    expect(result.imageCount).toBe(1);
    expect(new TextDecoder().decode(result.bytes)).toBe('encoded:photo.png');
  });

  it('zips a batch, keeping the order it was given', async () => {
    const result = await convertImages(
      { images: [source('b.png'), source('a.png'), source('c.png')], format: 'jpg' },
      encoder,
      vi.fn(),
    );

    expect(result.kind).toBe('zip');
    expect(result.imageCount).toBe(3);
    expect(names(result.bytes)).toEqual(['b.jpg', 'a.jpg', 'c.jpg']);
  });

  it('renames rather than overwrites when two sources collide', async () => {
    const result = await convertImages(
      {
        images: [source('logo.png'), source('logo.jpg', 'image/jpeg'), source('logo.webp')],
        format: 'avif',
      },
      encoder,
      vi.fn(),
    );

    const entries = unzipSync(new Uint8Array(result.bytes));
    expect(Object.keys(entries)).toEqual(['logo.avif', 'logo-2.avif', 'logo-3.avif']);
    expect(new TextDecoder().decode(entries['logo-2.avif'])).toBe('encoded:logo.jpg');
  });

  it('strips characters a zip reader would choke on', async () => {
    const result = await convertImages(
      { images: [source('in/voice:2024.png'), source('plain.png')], format: 'png' },
      encoder,
      vi.fn(),
    );

    expect(names(result.bytes)[0]).toBe('in-voice-2024.png');
  });

  it('needs at least one image', async () => {
    const error = await rejectsWithToolError(
      convertImages({ images: [], format: 'webp' }, encoder, vi.fn()),
    );

    expect(error.code).toBe('TOO_FEW_FILES');
  });

  it('surfaces an encoder failure instead of dropping the file', async () => {
    const failing: ImageEncoder = () => Promise.reject(new Error('no encoder'));

    await expect(
      convertImages({ images: [source('a.png')], format: 'avif' }, failing, vi.fn()),
    ).rejects.toThrow('no encoder');
  });

  it('reports progress that only moves forward', async () => {
    const report = vi.fn();
    await convertImages(
      { images: [source('a.png'), source('b.png'), source('c.png')], format: 'webp' },
      encoder,
      report,
    );

    const values = report.mock.calls.map(([value]) => value as number);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});
