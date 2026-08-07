import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `canEncode` caches its answer per format, so every case needs a fresh module
 * as well as a fresh canvas.
 *
 * `vi.resetModules` also gives the module its own copy of the contract package,
 * so the errors it throws are not the `ToolError` this file could import. The
 * assertions below match on the payload rather than on the class.
 */
async function loadRaster(writable: string[], record?: { contexts: number }) {
  class FakeCanvas {
    constructor(
      public width: number,
      public height: number,
    ) {}

    private context: object | null = null;

    getContext() {
      if (record) record.contexts += 1;
      this.context = {};
      return this.context;
    }

    convertToBlob({ type }: { type: string }) {
      // Chromium throws rather than encoding when nothing was ever drawn.
      if (!this.context) {
        return Promise.reject(new Error('"OffscreenCanvas" has no rendering context.'));
      }

      // An encoder that does not know the format falls back to PNG.
      return Promise.resolve({ type: writable.includes(type) ? type : 'image/png' });
    }
  }

  vi.resetModules();
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);

  return import('./raster');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('canEncode', () => {
  it('says yes when the encoder returns the format that was asked for', async () => {
    const { canEncode } = await loadRaster(['image/webp', 'image/png', 'image/jpeg']);

    await expect(canEncode('webp')).resolves.toBe(true);
  });

  it('treats a silent PNG fallback as unsupported', async () => {
    const { canEncode } = await loadRaster(['image/png', 'image/jpeg', 'image/webp']);

    await expect(canEncode('avif')).resolves.toBe(false);
  });

  it('draws a context first, or every format probes as unsupported', async () => {
    const record = { contexts: 0 };
    const { canEncode } = await loadRaster(['image/webp'], record);

    await canEncode('webp');
    expect(record.contexts).toBeGreaterThan(0);
  });

  it('answers no rather than throwing where there is no canvas at all', async () => {
    vi.resetModules();
    vi.stubGlobal('OffscreenCanvas', undefined);
    const { canEncode } = await import('./raster');

    await expect(canEncode('png')).resolves.toBe(false);
  });
});

describe('requireEncoder', () => {
  it('passes for a format the browser can write', async () => {
    const { requireEncoder } = await loadRaster(['image/jpeg']);

    await expect(requireEncoder('jpg')).resolves.toBeUndefined();
  });

  it('names the format and points at one that works', async () => {
    const { requireEncoder } = await loadRaster(['image/png']);

    await expect(requireEncoder('avif')).rejects.toMatchObject({
      code: 'PROCESSING_FAILED',
      message: expect.stringContaining('AVIF') as string,
      hint: expect.stringContaining('PNG') as string,
    });
  });
});
