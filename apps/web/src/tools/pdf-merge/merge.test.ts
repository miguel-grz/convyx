import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { ToolError } from '@convyx/tool-contract';
import { mergeDocuments, type SourceDocument } from './merge';

async function makePdf(name: string, pageCount: number): Promise<SourceDocument> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) document.addPage([300, 400]);

  const saved = await document.save();
  return { name, bytes: new Uint8Array(saved).buffer };
}

describe('mergeDocuments', () => {
  it('produces one document with every page, in order', async () => {
    const inputs = [await makePdf('a.pdf', 2), await makePdf('b.pdf', 3)];

    const result = await mergeDocuments(inputs, vi.fn());

    expect(result.pageCount).toBe(5);

    // Round-trip it: a file that pdf-lib cannot reopen is not a merged PDF, it
    // is just bytes.
    const reopened = await PDFDocument.load(result.bytes);
    expect(reopened.getPageCount()).toBe(5);
  });

  it('reports progress from first file to written output', async () => {
    const report = vi.fn();
    await mergeDocuments([await makePdf('a.pdf', 1), await makePdf('b.pdf', 1)], report);

    const values = report.mock.calls.map(([value]) => value as number);
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBeGreaterThan(0.9);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('refuses a single file rather than returning a copy of it', async () => {
    await expect(mergeDocuments([await makePdf('only.pdf', 1)], vi.fn())).rejects.toMatchObject({
      code: 'TOO_FEW_FILES',
    });
  });

  it('names the file that could not be read', async () => {
    const inputs = [
      await makePdf('good.pdf', 1),
      { name: 'broken.pdf', bytes: new TextEncoder().encode('not a pdf').buffer },
    ];

    const error = await mergeDocuments(inputs, vi.fn()).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ToolError);
    expect((error as ToolError).code).toBe('CORRUPT_FILE');
    expect((error as ToolError).message).toContain('broken.pdf');
    expect((error as ToolError).hint).toBeTruthy();
  });

  it('preserves the order the files were given in', async () => {
    const first = await PDFDocument.create();
    first.addPage([100, 100]);
    const second = await PDFDocument.create();
    second.addPage([500, 500]);

    const result = await mergeDocuments(
      [
        { name: 'small.pdf', bytes: new Uint8Array(await first.save()).buffer },
        { name: 'large.pdf', bytes: new Uint8Array(await second.save()).buffer },
      ],
      vi.fn(),
    );

    const reopened = await PDFDocument.load(result.bytes);
    expect(Math.round(reopened.getPage(0).getWidth())).toBe(100);
    expect(Math.round(reopened.getPage(1).getWidth())).toBe(500);
  });
});
