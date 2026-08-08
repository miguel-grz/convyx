import { describe, expect, it } from 'vitest';
import { dragRect, fitRect, wholeImage, MIN_SIDE } from './crop';

const bounds = { width: 1200, height: 800 };

describe('fitRect', () => {
  it('leaves a selection that already fits alone', () => {
    const rect = { x: 100, y: 50, width: 400, height: 300 };
    expect(fitRect(rect, bounds, null)).toEqual(rect);
  });

  it('rounds to whole pixels', () => {
    expect(fitRect({ x: 10.4, y: 20.6, width: 99.5, height: 50.2 }, bounds, null)).toEqual({
      x: 10,
      y: 21,
      width: 100,
      height: 50,
    });
  });

  it('pulls a selection that hangs off the edge back inside', () => {
    expect(fitRect({ x: 1100, y: 700, width: 400, height: 300 }, bounds, null)).toEqual({
      x: 800,
      y: 500,
      width: 400,
      height: 300,
    });
  });

  it('never lets a side collapse below the minimum', () => {
    const tiny = fitRect({ x: 0, y: 0, width: 1, height: 0 }, bounds, null);
    expect(tiny.width).toBe(MIN_SIDE);
    expect(tiny.height).toBe(MIN_SIDE);
  });

  it('caps a selection larger than the image', () => {
    expect(fitRect({ x: 0, y: 0, width: 5000, height: 5000 }, bounds, null)).toEqual({
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
    });
  });

  it('derives the height from the width when a ratio is locked', () => {
    const square = fitRect({ x: 0, y: 0, width: 400, height: 90 }, bounds, 1);
    expect(square).toMatchObject({ width: 400, height: 400 });
  });

  it('shrinks to fit when the ratio would push the selection past the edge', () => {
    // 1:1 at full width does not fit in an image only 800 tall.
    const square = fitRect({ x: 0, y: 0, width: 1200, height: 1200 }, bounds, 1);
    expect(square).toEqual({ x: 0, y: 0, width: 800, height: 800 });
  });

  it('handles a ratio wider than the image itself', () => {
    const wide = fitRect(
      { x: 0, y: 0, width: 4000, height: 100 },
      { width: 300, height: 900 },
      16 / 9,
    );
    expect(wide.width).toBe(300);
    expect(wide.height).toBe(169);
  });

  it('makes the anchored corner absorb a correction it did not ask for', () => {
    // A 2:1 ratio cuts this 400-tall selection down to 200. Which edge moves to
    // pay for that is exactly what the anchor decides.
    const asked = { x: 100, y: 100, width: 400, height: 400 };

    // Anchored south-east: the bottom stays at 500, so the top drops.
    expect(fitRect(asked, bounds, 2, 'se')).toEqual({
      x: 100,
      y: 300,
      width: 400,
      height: 200,
    });

    // Anchored north-west: the top stays and the bottom rises instead.
    expect(fitRect(asked, bounds, 2, 'nw')).toEqual({
      x: 100,
      y: 100,
      width: 400,
      height: 200,
    });
  });

  it('leaves the position alone when the size needed no correction', () => {
    // The anchor is about paying for a correction. With nothing to correct,
    // the rectangle is already where the caller put it.
    const rect = { x: 100, y: 100, width: 200, height: 200 };
    expect(fitRect(rect, bounds, null, 'se')).toEqual(rect);
  });
});

describe('dragRect', () => {
  const start = { x: 200, y: 100, width: 400, height: 300 };

  it('moves without resizing', () => {
    expect(dragRect(start, 'move', 50, -40, bounds, null)).toEqual({
      x: 250,
      y: 60,
      width: 400,
      height: 300,
    });
  });

  it('stops a move at the edge rather than cropping outside the image', () => {
    expect(dragRect(start, 'move', 9999, 9999, bounds, null)).toEqual({
      x: 800,
      y: 500,
      width: 400,
      height: 300,
    });
  });

  it('grows from the south-east corner, leaving the north-west still', () => {
    expect(dragRect(start, 'se', 100, 50, bounds, null)).toEqual({
      x: 200,
      y: 100,
      width: 500,
      height: 350,
    });
  });

  it('grows from the north-west corner, leaving the south-east still', () => {
    const next = dragRect(start, 'nw', -100, -50, bounds, null);
    expect(next).toEqual({ x: 100, y: 50, width: 500, height: 350 });
    expect(next.x + next.width).toBe(start.x + start.width);
  });

  it('moves one edge only', () => {
    expect(dragRect(start, 'e', 100, 999, bounds, null)).toEqual({
      x: 200,
      y: 100,
      width: 500,
      height: 300,
    });
  });

  it('flips rather than collapsing when an edge is dragged past its opposite', () => {
    const next = dragRect(start, 'w', 600, 0, bounds, null);
    expect(next.x).toBe(600);
    expect(next.width).toBe(200);
  });

  it('keeps the ratio while dragging a corner', () => {
    const next = dragRect(start, 'se', 100, 0, bounds, 1);
    expect(next.width).toBe(next.height);
    expect(next.width).toBe(500);
  });

  it('does not let a drag leave the image', () => {
    const next = dragRect(start, 'se', 9999, 9999, bounds, null);
    expect(next.x + next.width).toBeLessThanOrEqual(bounds.width);
    expect(next.y + next.height).toBeLessThanOrEqual(bounds.height);
  });
});

describe('wholeImage', () => {
  it('selects everything when nothing is locked', () => {
    expect(wholeImage(bounds)).toEqual({ x: 0, y: 0, width: 1200, height: 800 });
  });

  it('selects the largest area the ratio allows', () => {
    expect(wholeImage(bounds, 1)).toEqual({ x: 0, y: 0, width: 800, height: 800 });
  });
});
