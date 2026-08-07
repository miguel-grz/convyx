import { describe, expect, it } from 'vitest';
import { formatBytes, sizeDelta, stripExtension, truncateFilename } from './format';

describe('formatBytes', () => {
  it('formats each unit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1_536_000)).toBe('1.5 MB');
    expect(formatBytes(3 * 1024 ** 3)).toBe('3.0 GB');
  });

  it('drops the decimal once the number is wide enough', () => {
    expect(formatBytes(150 * 1024)).toBe('150 KB');
  });

  it('handles nothing and nonsense', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });
});

describe('truncateFilename', () => {
  it('leaves short names alone', () => {
    expect(truncateFilename('report.pdf')).toBe('report.pdf');
  });

  it('keeps the extension visible', () => {
    const result = truncateFilename('a'.repeat(80) + '.pdf', 20);
    expect(result).toHaveLength(20);
    expect(result.endsWith('.pdf')).toBe(true);
  });

  it('handles a name with no extension', () => {
    expect(truncateFilename('x'.repeat(50), 10)).toHaveLength(10);
  });
});

describe('stripExtension', () => {
  it('removes only the last extension', () => {
    expect(stripExtension('report.final.pdf')).toBe('report.final');
  });

  it('leaves dotfiles intact', () => {
    expect(stripExtension('.gitignore')).toBe('.gitignore');
  });
});

describe('sizeDelta', () => {
  it('reports a reduction as a negative percentage', () => {
    expect(sizeDelta(1000, 250)).toBe(-75);
  });

  it('reports growth as positive', () => {
    expect(sizeDelta(100, 150)).toBe(50);
  });

  it('does not divide by zero', () => {
    expect(sizeDelta(0, 100)).toBe(0);
  });
});
