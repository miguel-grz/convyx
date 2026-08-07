import { describe, expect, it } from 'vitest';
import { TOOL_CATEGORIES } from '@convyx/tool-contract';
import { getFeaturedTools, getTool, loadToolComponent, searchTools, tools } from './registry';

/**
 * These guard the registry's contract rather than any one tool. If someone adds
 * a tool with a broken manifest, this suite is what tells them — the registry's
 * own invariants throw at import time and would surface here first.
 */
describe('tool registry', () => {
  it('discovers every tool folder', () => {
    expect(tools.length).toBeGreaterThan(0);
  });

  it('gives each tool a unique id that matches its route', () => {
    const ids = tools.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const id of ids) {
      expect(getTool(id)?.id).toBe(id);
    }
  });

  it('uses slug-safe ids', () => {
    for (const tool of tools) {
      expect(tool.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('only uses categories declared in the contract', () => {
    for (const tool of tools) {
      expect(TOOL_CATEGORIES).toContain(tool.category);
    }
  });

  it('gives every available tool a component to render', () => {
    for (const tool of tools.filter((entry) => entry.status === 'available')) {
      expect(loadToolComponent(tool.id)).not.toBeNull();
    }
  });

  it('gives every server tool an endpoint, and no client tool one', () => {
    for (const tool of tools) {
      if (tool.processing === 'server') expect(tool.endpoint).toBeTruthy();
      else expect(tool.endpoint).toBeUndefined();
    }
  });

  it('declares a coherent file count and accept spec', () => {
    for (const tool of tools) {
      expect(tool.files.min).toBeGreaterThan(0);
      if (tool.files.max !== null) expect(tool.files.max).toBeGreaterThanOrEqual(tool.files.min);
      expect(Object.keys(tool.accepts.mimeTypes).length).toBeGreaterThan(0);
      expect(tool.maxFileSizeMB).toBeGreaterThan(0);
    }
  });

  it('writes copy for every tool', () => {
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(2);
      expect(tool.summary.length).toBeGreaterThan(10);
      expect(tool.description.length).toBeGreaterThan(40);
    }
  });
});

describe('searchTools', () => {
  it('returns the whole catalog for an empty query', () => {
    expect(searchTools('  ')).toHaveLength(tools.length);
  });

  it('ranks a name match above a keyword match', () => {
    const results = searchTools('merge');
    expect(results[0]?.id).toBe('pdf-merge');
  });

  it('matches Spanish keywords', () => {
    expect(searchTools('comprimir').map((tool) => tool.id)).toContain('image-compress');
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(searchTools('zzzznope')).toHaveLength(0);
  });
});

describe('getFeaturedTools', () => {
  it('never surfaces a tool that cannot be run', () => {
    for (const tool of getFeaturedTools()) {
      expect(tool.status).toBe('available');
    }
  });

  it('respects the limit', () => {
    expect(getFeaturedTools(2).length).toBeLessThanOrEqual(2);
  });
});
