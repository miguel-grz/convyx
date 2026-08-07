import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { rejectsWithToolError } from '@/test/toolError';
import { organizePdf } from './organize';

/** Distinct page widths, so the resulting order is verifiable. */
async function makePdf(pageCount: number): Promise<ArrayBuffer> {
  const document = await PDFDocument.create();
  for (let page = 1; page <= pageCount; page += 1) document.addPage([page * 10, 500]);
  return new Uint8Array(await document.save()).buffer;
}

async function widthsOf(bytes: ArrayBuffer): Promise<number[]> {
  const document = await PDFDocument.load(bytes);
  return document.getPages().map((page) => Math.round(page.getWidth()));
}

const base = { name: 'doc.pdf' };

describe('organizePdf', () => {
  it('rebuilds the document in the order given', async () => {
    const result = await organizePdf(
      { ...base, bytes: await makePdf(4), order: [3, 1, 4, 2] },
      vi.fn(),
    );

    expect(result.pageCount).toBe(4);
    expect(await widthsOf(result.bytes)).toEqual([30, 10, 40, 20]);
  });

  it('treats a page left out of the order as deleted', async () => {
    const result = await organizePdf(
      { ...base, bytes: await makePdf(5), order: [1, 2, 5] },
      vi.fn(),
    );

    expect(await widthsOf(result.bytes)).toEqual([10, 20, 50]);
  });

  it('handles reordering and deleting at once', async () => {
    const result = await organizePdf({ ...base, bytes: await makePdf(6), order: [6, 2] }, vi.fn());

    expect(await widthsOf(result.bytes)).toEqual([60, 20]);
  });

  it('refuses to produce a document with no pages', async () => {
    const error = await rejectsWithToolError(
      organizePdf({ ...base, bytes: await makePdf(3), order: [] }, vi.fn()),
    );

    expect(error.message).toContain('removed every page');
    expect(error.hint).toBeTruthy();
  });

  it('rejects a page the document does not have', async () => {
    const error = await rejectsWithToolError(
      organizePdf({ ...base, bytes: await makePdf(3), order: [1, 9] }, vi.fn()),
    );

    expect(error.message).toContain('Page 9');
    expect(error.hint).toContain('3 pages');
  });

  it('rejects the same page listed twice', async () => {
    const error = await rejectsWithToolError(
      organizePdf({ ...base, bytes: await makePdf(3), order: [2, 1, 2] }, vi.fn()),
    );

    expect(error.message).toContain('listed twice');
  });

  it('names a file it could not read', async () => {
    const error = await rejectsWithToolError(
      organizePdf(
        { name: 'broken.pdf', bytes: new TextEncoder().encode('nope').buffer, order: [1] },
        vi.fn(),
      ),
    );

    expect(error.code).toBe('CORRUPT_FILE');
    expect(error.message).toContain('broken.pdf');
  });
});
