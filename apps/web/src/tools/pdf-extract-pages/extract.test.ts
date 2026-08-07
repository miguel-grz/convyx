import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { ToolError } from '@convyx/tool-contract';
import { rejectsWithToolError } from '@/test/toolError';
import { extractPages } from './extract';

/** A document whose pages are all different widths, so order is verifiable. */
async function makePdf(pageCount: number): Promise<ArrayBuffer> {
  const document = await PDFDocument.create();
  for (let page = 1; page <= pageCount; page += 1) document.addPage([page * 10, 500]);
  return new Uint8Array(await document.save()).buffer;
}

async function widthsOf(bytes: ArrayBuffer): Promise<number[]> {
  const document = await PDFDocument.load(bytes);
  return document.getPages().map((page) => Math.round(page.getWidth()));
}

describe('extractPages', () => {
  it('keeps only the pages asked for', async () => {
    const result = await extractPages(
      { name: 'a.pdf', bytes: await makePdf(10), pages: '2-4' },
      vi.fn(),
    );

    expect(result.pageCount).toBe(3);
    expect(await widthsOf(result.bytes)).toEqual([20, 30, 40]);
  });

  it('handles a mixed list', async () => {
    const result = await extractPages(
      { name: 'a.pdf', bytes: await makePdf(12), pages: '1, 5-6, 11-' },
      vi.fn(),
    );

    expect(await widthsOf(result.bytes)).toEqual([10, 50, 60, 110, 120]);
  });

  it('emits pages in document order regardless of how they were listed', async () => {
    const result = await extractPages(
      { name: 'a.pdf', bytes: await makePdf(6), pages: '5, 1, 3' },
      vi.fn(),
    );

    expect(await widthsOf(result.bytes)).toEqual([10, 30, 50]);
  });

  it('includes a page listed twice exactly once', async () => {
    const result = await extractPages(
      { name: 'a.pdf', bytes: await makePdf(6), pages: '2, 2, 1-2' },
      vi.fn(),
    );

    expect(await widthsOf(result.bytes)).toEqual([10, 20]);
  });

  it('validates the range against the real document, not the field', async () => {
    const error = await rejectsWithToolError(
      extractPages({ name: 'a.pdf', bytes: await makePdf(3), pages: '1-9' }, vi.fn()),
    );

    expect(error).toBeInstanceOf(ToolError);
    expect(error.message).toContain('3 pages');
  });

  it('names the file it could not read', async () => {
    const error = await rejectsWithToolError(
      extractPages(
        { name: 'broken.pdf', bytes: new TextEncoder().encode('nope').buffer, pages: '1' },
        vi.fn(),
      ),
    );

    expect(error.code).toBe('CORRUPT_FILE');
    expect(error.message).toContain('broken.pdf');
  });

  it('reports progress from open to written', async () => {
    const report = vi.fn();
    await extractPages({ name: 'a.pdf', bytes: await makePdf(4), pages: '1-2' }, report);

    const values = report.mock.calls.map(([value]) => value as number);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values.at(-1)).toBeGreaterThan(0.8);
  });
});
