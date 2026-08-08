import { describe, expect, it, vi } from 'vitest';
import { unzipSync } from 'fflate';
import { rejectsWithToolError } from '@/test/toolError';
import {
  flip,
  isUpright,
  orientedSize,
  previewTransform,
  rotateImages,
  turn,
  UPRIGHT,
  type Orientation,
  type SourceImage,
} from './rotate';

describe('turn', () => {
  it('steps a quarter at a time', () => {
    expect(turn(UPRIGHT, 90).rotation).toBe(90);
    expect(turn(turn(UPRIGHT, 90), 90).rotation).toBe(180);
  });

  it('wraps back round rather than growing without limit', () => {
    const fourTimes = [90, 90, 90, 90].reduce(turn, UPRIGHT);

    expect(fourTimes.rotation).toBe(0);
    expect(isUpright(fourTimes)).toBe(true);
  });

  it('wraps the same way going anticlockwise', () => {
    expect(turn(UPRIGHT, -90).rotation).toBe(270);
    expect(turn(turn(UPRIGHT, -90), -270).rotation).toBe(0);
  });

  it('leaves the mirrors alone', () => {
    const mirrored: Orientation = { rotation: 0, flipX: true, flipY: false };
    expect(turn(mirrored, 90)).toEqual({ rotation: 90, flipX: true, flipY: false });
  });
});

describe('flip', () => {
  it('mirrors the stored image directly while it is upright', () => {
    expect(flip(UPRIGHT, 'horizontal')).toEqual({ rotation: 0, flipX: true, flipY: false });
    expect(flip(UPRIGHT, 'vertical')).toEqual({ rotation: 0, flipX: false, flipY: true });
  });

  it('still mirrors directly at half a turn', () => {
    const upsideDown = turn(UPRIGHT, 180);
    expect(flip(upsideDown, 'horizontal').flipX).toBe(true);
    expect(flip(upsideDown, 'vertical').flipY).toBe(true);
  });

  it('swaps axes once the image is on its side', () => {
    // On screen the image is horizontal; in the file it is not. A horizontal
    // flip of what is shown is a vertical flip of what is stored.
    const onItsSide = turn(UPRIGHT, 90);

    expect(flip(onItsSide, 'horizontal')).toEqual({ rotation: 90, flipX: false, flipY: true });
    expect(flip(onItsSide, 'vertical')).toEqual({ rotation: 90, flipX: true, flipY: false });
  });

  it('swaps axes at three quarters too', () => {
    const other = turn(UPRIGHT, 270);
    expect(flip(other, 'horizontal').flipY).toBe(true);
  });

  it('undoes itself', () => {
    for (const rotation of [0, 90, 180, 270] as const) {
      const start = turn(UPRIGHT, rotation);
      expect(flip(flip(start, 'horizontal'), 'horizontal')).toEqual(start);
    }
  });
});

describe('orientedSize', () => {
  const size = { width: 1200, height: 800 };

  it('keeps the sides on a half turn', () => {
    expect(orientedSize(size, UPRIGHT)).toEqual(size);
    expect(orientedSize(size, turn(UPRIGHT, 180))).toEqual(size);
  });

  it('swaps the sides on a quarter turn', () => {
    expect(orientedSize(size, turn(UPRIGHT, 90))).toEqual({ width: 800, height: 1200 });
    expect(orientedSize(size, turn(UPRIGHT, 270))).toEqual({ width: 800, height: 1200 });
  });

  it('is unaffected by mirrors', () => {
    expect(orientedSize(size, flip(UPRIGHT, 'horizontal'))).toEqual(size);
  });
});

describe('previewTransform', () => {
  it('describes the same order the encoder draws in', () => {
    expect(previewTransform(UPRIGHT)).toBe('rotate(0deg) scale(1, 1)');
    expect(previewTransform({ rotation: 90, flipX: true, flipY: false })).toBe(
      'rotate(90deg) scale(-1, 1)',
    );
  });
});

function source(name: string, type = 'image/jpeg'): SourceImage {
  return { name, type, bytes: new ArrayBuffer(8) };
}

const rotator = (image: SourceImage) =>
  Promise.resolve(new TextEncoder().encode(`turned:${image.name}`));

describe('rotateImages', () => {
  it('returns the image itself when there is only one', async () => {
    const result = await rotateImages([source('photo.jpg')], rotator, vi.fn());

    expect(result.kind).toBe('image');
    expect(result.name).toBe('photo.jpg');
    expect(new TextDecoder().decode(result.bytes)).toBe('turned:photo.jpg');
  });

  it('keeps every name, because turning does not change the format', async () => {
    const result = await rotateImages(
      [source('a.jpg'), source('b.png', 'image/png')],
      rotator,
      vi.fn(),
    );

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))).toEqual(['a.jpg', 'b.png']);
  });

  it('renames rather than overwrites when two sources share a name', async () => {
    const result = await rotateImages([source('img.jpg'), source('img.jpg')], rotator, vi.fn());

    expect(Object.keys(unzipSync(new Uint8Array(result.bytes)))).toEqual(['img.jpg', 'img-2.jpg']);
  });

  it('needs at least one image', async () => {
    const error = await rejectsWithToolError(rotateImages([], rotator, vi.fn()));

    expect(error.code).toBe('TOO_FEW_FILES');
  });

  it('reports progress that only moves forward', async () => {
    const report = vi.fn();
    await rotateImages([source('a.jpg'), source('b.jpg'), source('c.jpg')], rotator, report);

    const values = report.mock.calls.map(([value]) => value as number);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});
