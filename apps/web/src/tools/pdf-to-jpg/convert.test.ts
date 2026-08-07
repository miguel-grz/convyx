import { describe, expect, it, vi } from 'vitest';
import { unzipSync } from 'fflate';
import { rejectsWithToolError } from '@/test/toolError';
import { convertToImages, type PageRenderer } from './convert';

/** Encodes the page number into the bytes, so each output is identifiable. */
const renderer: PageRenderer = (pageNumber) =>
  Promise.resolve(new Uint8Array([pageNumber, pageNumber, pageNumber]));

const base = { baseName: 'doc', extension: 'jpg' as const };

describe('convertToImages', () => {
  it('returns the image itself when one page comes out', async () => {
    const result = await convertToImages({ ...base, pageCount: 5, pages: '3' }, renderer, vi.fn());

    expect(result.kind).toBe('image');
    expect(result.imageCount).toBe(1);
    expect(new Uint8Array(result.bytes)).toEqual(new Uint8Array([3, 3, 3]));
  });

  it('renders every page when no selection is given', async () => {
    const result = await convertToImages({ ...base, pageCount: 4, pages: '' }, renderer, vi.fn());

    const entries = unzipSync(new Uint8Array(result.bytes));
    expect(Object.keys(entries)).toEqual(['doc-1.jpg', 'doc-2.jpg', 'doc-3.jpg', 'doc-4.jpg']);
  });

  it('zero-pads names so files sort correctly past page nine', async () => {
    const result = await convertToImages({ ...base, pageCount: 12, pages: '' }, renderer, vi.fn());

    const names = Object.keys(unzipSync(new Uint8Array(result.bytes)));
    expect(names[0]).toBe('doc-01.jpg');
    expect(names.at(-1)).toBe('doc-12.jpg');
    expect([...names].sort()).toEqual(names);
  });

  it('renders only the pages selected, in document order', async () => {
    const result = await convertToImages(
      { ...base, pageCount: 9, pages: '7, 2-3' },
      renderer,
      vi.fn(),
    );

    const entries = unzipSync(new Uint8Array(result.bytes));
    expect(Object.keys(entries)).toEqual(['doc-2.jpg', 'doc-3.jpg', 'doc-7.jpg']);
    expect(entries['doc-7.jpg']).toEqual(new Uint8Array([7, 7, 7]));
  });

  it('uses the chosen extension', async () => {
    const result = await convertToImages(
      { ...base, extension: 'png', pageCount: 3, pages: '' },
      renderer,
      vi.fn(),
    );

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))[0]).toBe('doc-1.png');
  });

  it('validates the selection against the document', async () => {
    const error = await rejectsWithToolError(
      convertToImages({ ...base, pageCount: 3, pages: '9' }, renderer, vi.fn()),
    );

    expect(error.message).toContain('3 pages');
  });

  it('reports progress that only moves forward', async () => {
    const report = vi.fn();
    await convertToImages({ ...base, pageCount: 6, pages: '' }, renderer, report);

    const values = report.mock.calls.map(([value]) => value as number);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});
