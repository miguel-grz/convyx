export interface Dimensions {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Which corner stays put while the size changes. */
export type Anchor = 'nw' | 'ne' | 'sw' | 'se';

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

/**
 * Small enough to crop a detail out of a photo, large enough that a stray click
 * cannot leave a selection nobody can grab again.
 */
export const MIN_SIDE = 8;

/**
 * Fits a proposed selection to the image and to the locked ratio.
 *
 * Everything that changes the selection goes through here — the drag, the
 * number fields, the ratio buttons — so there is one definition of a valid
 * selection instead of three that drift apart. It is in source pixels, never
 * display pixels: what someone sees is a scaled copy, and rounding the crop at
 * display scale would cut a different rectangle than the one on screen.
 *
 * With a ratio locked, width drives and height follows. The alternative is
 * asking each caller which side it meant, and every answer to that produces a
 * selection that fights the person adjusting it.
 */
export function fitRect(
  rect: Rect,
  bounds: Dimensions,
  ratio: number | null,
  anchor: Anchor = 'nw',
): Rect {
  const limit = (value: number, max: number) =>
    Math.min(Math.max(Math.round(value), MIN_SIDE), Math.max(max, MIN_SIDE));

  let width = limit(rect.width, bounds.width);
  let height = limit(rect.height, bounds.height);

  if (ratio) {
    height = Math.max(Math.round(width / ratio), MIN_SIDE);

    // Correct in whichever direction overflowed, then once more for the other:
    // a very wide ratio inside a narrow image needs both passes.
    if (height > bounds.height) {
      height = bounds.height;
      width = Math.max(Math.round(height * ratio), MIN_SIDE);
    }

    if (width > bounds.width) {
      width = bounds.width;
      height = Math.max(Math.round(width / ratio), MIN_SIDE);
    }
  }

  // The anchored corner is the one the drag is not moving, so the opposite
  // edges absorb the change in size.
  const east = anchor === 'ne' || anchor === 'se';
  const south = anchor === 'sw' || anchor === 'se';

  const x = east ? rect.x + rect.width - width : rect.x;
  const y = south ? rect.y + rect.height - height : rect.y;

  return {
    x: Math.min(Math.max(Math.round(x), 0), Math.max(bounds.width - width, 0)),
    y: Math.min(Math.max(Math.round(y), 0), Math.max(bounds.height - height, 0)),
    width,
    height,
  };
}

/**
 * The selection after dragging one handle by a distance in source pixels.
 *
 * Dragging an edge past its opposite flips the selection rather than collapsing
 * it, which is what every image editor does and what the hand expects.
 */
export function dragRect(
  start: Rect,
  handle: Handle,
  dx: number,
  dy: number,
  bounds: Dimensions,
  ratio: number | null,
): Rect {
  if (handle === 'move') {
    // The size is settled, so the ratio has nothing to say here.
    return fitRect({ ...start, x: start.x + dx, y: start.y + dy }, bounds, null);
  }

  const left = handle.includes('w') ? start.x + dx : start.x;
  const right = handle.includes('e') ? start.x + start.width + dx : start.x + start.width;
  const top = handle.includes('n') ? start.y + dy : start.y;
  const bottom = handle.includes('s') ? start.y + start.height + dy : start.y + start.height;

  const anchor = `${handle.includes('n') ? 's' : 'n'}${handle.includes('w') ? 'e' : 'w'}` as Anchor;

  return fitRect(
    {
      x: Math.min(left, right),
      y: Math.min(top, bottom),
      width: Math.abs(right - left),
      height: Math.abs(bottom - top),
    },
    bounds,
    ratio,
    anchor,
  );
}

/** The whole image, which is where a new selection starts. */
export function wholeImage(bounds: Dimensions, ratio: number | null = null): Rect {
  return fitRect({ x: 0, y: 0, ...bounds }, bounds, ratio);
}
