import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { unzipSync } from 'fflate';
import { ToolError } from '@convyx/tool-contract';
import { rejectsWithToolError } from '@/test/toolError';
import { splitPdf } from './split';

/** Pages of distinct widths, so each piece can be identified by its content. */
async function makePdf(pageCount: number): Promise<ArrayBuffer> {
  const document = await PDFDocument.create();
  for (let page = 1; page <= pageCount; page += 1) document.addPage([page * 10, 500]);
  return new Uint8Array(await document.save()).buffer;
}

async function widthsOf(bytes: ArrayBuffer | Uint8Array): Promise<number[]> {
  const document = await PDFDocument.load(bytes);
  return document.getPages().map((page) => Math.round(page.getWidth()));
}

const base = { name: 'doc.pdf', baseName: 'doc' };

describe('splitPdf', () => {
  it('returns one PDF, not a zip, when a single range is asked for', async () => {
    const result = await splitPdf(
      { ...base, bytes: await makePdf(8), mode: 'ranges', ranges: '3-5' },
      vi.fn(),
    );

    expect(result.kind).toBe('pdf');
    expect(result.documentCount).toBe(1);
    expect(await widthsOf(result.bytes)).toEqual([30, 40, 50]);
  });

  it('bundles several ranges into a zip, one entry each', async () => {
    const result = await splitPdf(
      { ...base, bytes: await makePdf(9), mode: 'ranges', ranges: '1-2, 5, 8-' },
      vi.fn(),
    );

    expect(result.kind).toBe('zip');
    expect(result.documentCount).toBe(3);

    const entries = unzipSync(new Uint8Array(result.bytes));
    expect(Object.keys(entries).sort()).toEqual(['doc-1-2.pdf', 'doc-5.pdf', 'doc-8-9.pdf']);
    expect(await widthsOf(entries['doc-1-2.pdf']!)).toEqual([10, 20]);
    expect(await widthsOf(entries['doc-8-9.pdf']!)).toEqual([80, 90]);
  });

  it('writes one file per page in every-page mode', async () => {
    const result = await splitPdf(
      { ...base, bytes: await makePdf(4), mode: 'every-page', ranges: '' },
      vi.fn(),
    );

    const entries = unzipSync(new Uint8Array(result.bytes));
    expect(Object.keys(entries)).toHaveLength(4);
    expect(await widthsOf(entries['doc-3.pdf']!)).toEqual([30]);
  });

  it('refuses to split a one-page document into pages', async () => {
    const error = await rejectsWithToolError(
      splitPdf({ ...base, bytes: await makePdf(1), mode: 'every-page', ranges: '' }, vi.fn()),
    );

    expect(error).toBeInstanceOf(ToolError);
    expect(error.message).toContain('one page');
  });

  it('validates ranges against the real document', async () => {
    const error = await rejectsWithToolError(
      splitPdf({ ...base, bytes: await makePdf(4), mode: 'ranges', ranges: '2-99' }, vi.fn()),
    );

    expect(error.message).toContain('4 pages');
  });

  it('keeps a filename with a slash out of the zip entry names', async () => {
    const result = await splitPdf(
      { name: 'a/b.pdf', baseName: 'a/b', bytes: await makePdf(4), mode: 'ranges', ranges: '1, 2' },
      vi.fn(),
    );

    const names = Object.keys(unzipSync(new Uint8Array(result.bytes)));
    expect(names.every((name) => !name.includes('/'))).toBe(true);
  });
});
