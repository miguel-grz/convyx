import { ToolError } from '@convyx/tool-contract';

/** A run of pages, 1-based and inclusive, the way a person writes them. */
export interface PageRange {
  start: number;
  end: number;
}

/**
 * Parses the page selection people already know how to write: `1-3, 7, 12-`.
 *
 * Shared by split, extract and rotate, which is why it lives here rather than in
 * a tool. Every rejection names the token that failed and what would be valid,
 * because "invalid input" on a field like this is useless — the user cannot see
 * which of six ranges we objected to.
 *
 * @param input     the raw field value
 * @param pageCount how many pages the document actually has
 */
export function parsePageRanges(input: string, pageCount: number): PageRange[] {
  const text = input.trim();

  if (!text) {
    throw new ToolError('PROCESSING_FAILED', 'Tell us which pages you want.', {
      hint: `This document has ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}. Try 1-3, 7 or 5-.`,
    });
  }

  const ranges: PageRange[] = [];

  for (const raw of text.split(',')) {
    const token = raw.trim();
    if (!token) continue;

    const match = /^(\d*)\s*(-?)\s*(\d*)$/.exec(token);
    if (!match || (!match[1] && !match[3])) {
      throw new ToolError('PROCESSING_FAILED', `“${token}” is not a page or a range.`, {
        hint: 'Use a page like 4, a range like 2-6, or 9- for everything from page 9 on.',
      });
    }

    const [, from, dash, to] = match;

    // `4` is the range 4-4; `4-` runs to the end; `-4` starts at the beginning.
    const start = from ? Number(from) : 1;
    const end = dash ? (to ? Number(to) : pageCount) : Number(from);

    if (start < 1 || end < 1) {
      throw new ToolError('PROCESSING_FAILED', `“${token}” starts before page 1.`, {
        hint: 'Pages are numbered from 1.',
      });
    }

    if (start > pageCount || end > pageCount) {
      throw new ToolError(
        'PROCESSING_FAILED',
        `“${token}” goes past the end — this document has ${pageCount} ${
          pageCount === 1 ? 'page' : 'pages'
        }.`,
      );
    }

    if (start > end) {
      throw new ToolError('PROCESSING_FAILED', `“${token}” runs backwards.`, {
        hint: `Write it as ${end}-${start}.`,
      });
    }

    ranges.push({ start, end });
  }

  if (ranges.length === 0) {
    throw new ToolError('PROCESSING_FAILED', 'Tell us which pages you want.', {
      hint: `This document has ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}.`,
    });
  }

  return ranges;
}

/**
 * Flattens ranges to zero-based page indices for pdf-lib.
 *
 * Overlaps collapse and order is normalised: asking for `5, 1-3, 2` gets pages
 * 1, 2, 3 and 5 once each, in document order. Someone listing pages twice means
 * "include it", not "duplicate it".
 */
export function toPageIndices(ranges: PageRange[]): number[] {
  const pages = new Set<number>();

  for (const range of ranges) {
    for (let page = range.start; page <= range.end; page += 1) pages.add(page - 1);
  }

  return [...pages].sort((a, b) => a - b);
}

/** How many pages a selection covers, for the "12 of 40 pages" readout. */
export function countPages(ranges: PageRange[]): number {
  return toPageIndices(ranges).length;
}

/** `{ start: 3, end: 3 }` → `3`; `{ start: 3, end: 7 }` → `3-7`. Used in filenames. */
export function formatRange(range: PageRange): string {
  return range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`;
}
