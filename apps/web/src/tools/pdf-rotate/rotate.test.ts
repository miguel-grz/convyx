import { describe, expect, it, vi } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';
import { ToolError } from '@convyx/tool-contract';
import { rejectsWithToolError } from '@/test/toolError';
import { rotatePdf } from './rotate';

async function makePdf(pageCount: number, existing = 0): Promise<ArrayBuffer> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    const page = document.addPage([400, 500]);
    if (existing) page.setRotation(degrees(existing));
  }
  return new Uint8Array(await document.save()).buffer;
}

async function anglesOf(bytes: ArrayBuffer): Promise<number[]> {
  const document = await PDFDocument.load(bytes);
  return document.getPages().map((page) => page.getRotation().angle);
}

const base = { name: 'doc.pdf' };

describe('rotatePdf', () => {
  it('turns every page when no selection is given', async () => {
    const result = await rotatePdf(
      { ...base, bytes: await makePdf(3), angle: 90, pages: '' },
      vi.fn(),
    );

    expect(result.rotatedCount).toBe(3);
    expect(await anglesOf(result.bytes)).toEqual([90, 90, 90]);
  });

  it('turns only the pages selected', async () => {
    const result = await rotatePdf(
      { ...base, bytes: await makePdf(4), angle: 180, pages: '2, 4' },
      vi.fn(),
    );

    expect(result.rotatedCount).toBe(2);
    expect(await anglesOf(result.bytes)).toEqual([0, 180, 0, 180]);
  });

  it('adds to the rotation a page already carries', async () => {
    const result = await rotatePdf(
      { ...base, bytes: await makePdf(2, 90), angle: 90, pages: '' },
      vi.fn(),
    );

    expect(await anglesOf(result.bytes)).toEqual([180, 180]);
  });

  it('wraps past a full turn instead of accumulating', async () => {
    const result = await rotatePdf(
      { ...base, bytes: await makePdf(1, 270), angle: 180, pages: '' },
      vi.fn(),
    );

    expect(await anglesOf(result.bytes)).toEqual([90]);
  });

  it('validates a selection against the real document', async () => {
    const error = await rejectsWithToolError(
      rotatePdf({ ...base, bytes: await makePdf(2), angle: 90, pages: '7' }, vi.fn()),
    );

    expect(error).toBeInstanceOf(ToolError);
    expect(error.message).toContain('2 pages');
  });
});
