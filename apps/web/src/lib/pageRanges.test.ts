import { describe, expect, it } from 'vitest';
import { throwsToolError } from '@/test/toolError';
import { countPages, formatRange, parsePageRanges, toPageIndices } from './pageRanges';

describe('parsePageRanges', () => {
  it('reads a single page as a one-page range', () => {
    expect(parsePageRanges('4', 10)).toEqual([{ start: 4, end: 4 }]);
  });

  it('reads a closed range', () => {
    expect(parsePageRanges('2-6', 10)).toEqual([{ start: 2, end: 6 }]);
  });

  it('reads an open end as "to the last page"', () => {
    expect(parsePageRanges('7-', 10)).toEqual([{ start: 7, end: 10 }]);
  });

  it('reads an open start as "from the first page"', () => {
    expect(parsePageRanges('-3', 10)).toEqual([{ start: 1, end: 3 }]);
  });

  it('reads a comma-separated list, whitespace and all', () => {
    expect(parsePageRanges('  1-3 ,7,  12-  ', 14)).toEqual([
      { start: 1, end: 3 },
      { start: 7, end: 7 },
      { start: 12, end: 14 },
    ]);
  });

  it('names the token it could not read', () => {
    const error = throwsToolError(() => parsePageRanges('1-3, banana', 10));
    expect(error.code).toBe('PROCESSING_FAILED');
    expect(error.message).toContain('banana');
    expect(error.hint).toBeTruthy();
  });

  it('rejects a range past the end, quoting the real page count', () => {
    const error = throwsToolError(() => parsePageRanges('8-20', 12));
    expect(error.message).toContain('12 pages');
  });

  it('rejects a backwards range and suggests the fix', () => {
    const error = throwsToolError(() => parsePageRanges('9-4', 10));
    expect(error.message).toContain('backwards');
    expect(error.hint).toContain('4-9');
  });

  it('rejects page zero', () => {
    expect(throwsToolError(() => parsePageRanges('0-3', 10)).message).toContain('before page 1');
  });

  it('rejects an empty selection', () => {
    expect(throwsToolError(() => parsePageRanges('   ', 10)).code).toBe('PROCESSING_FAILED');
    expect(throwsToolError(() => parsePageRanges(' , , ', 10)).code).toBe('PROCESSING_FAILED');
  });

  it('says how many pages the document has when the field is empty', () => {
    expect(throwsToolError(() => parsePageRanges('', 1)).hint).toContain('1 page');
  });
});

describe('toPageIndices', () => {
  it('converts to zero-based indices', () => {
    expect(toPageIndices([{ start: 1, end: 3 }])).toEqual([0, 1, 2]);
  });

  it('collapses overlaps and sorts into document order', () => {
    const ranges = parsePageRanges('5, 1-3, 2', 10);
    expect(toPageIndices(ranges)).toEqual([0, 1, 2, 4]);
  });

  it('counts what the selection actually covers', () => {
    expect(countPages(parsePageRanges('1-3, 2-4', 10))).toBe(4);
  });
});

describe('formatRange', () => {
  it('writes a single page without a dash', () => {
    expect(formatRange({ start: 3, end: 3 })).toBe('3');
    expect(formatRange({ start: 3, end: 7 })).toBe('3-7');
  });
});
