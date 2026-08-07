import type { ComponentType } from 'react';
import {
  CATEGORY_META,
  TOOL_CATEGORIES,
  type ToolCategory,
  type ToolComponentProps,
  type ToolManifest,
} from '@convyx/tool-contract';

/**
 * The Tool Registry.
 *
 * Every folder under `src/tools/` that exports a manifest becomes a tool: it
 * gets a route, a catalog card, a search entry and a slot in the category nav.
 * Nothing in the app shell knows the name of a single tool.
 *
 * Adding a tool is three files and zero edits anywhere else:
 *
 *   src/tools/<id>/manifest.ts   default-exports a ToolManifest
 *   src/tools/<id>/handler.ts    the actual work (client-side or an API call)
 *   src/tools/<id>/Tool.tsx      default-exports the tool UI
 *
 * `Tool.tsx` is only ever reached through the lazy loader below, so a tool's
 * dependencies — pdf-lib, a WASM blob — stay out of the initial bundle.
 */

type ManifestModule = { default: ToolManifest };
type ToolModule = { default: ComponentType<ToolComponentProps> };

const manifestModules = import.meta.glob<ManifestModule>('./*/manifest.ts', { eager: true });
const componentLoaders = import.meta.glob<ToolModule>('./*/Tool.tsx');

/** `'./pdf-merge/manifest.ts'` -> `'pdf-merge'` */
function folderOf(path: string): string {
  return path.split('/')[1] ?? '';
}

function buildRegistry(): ToolManifest[] {
  const manifests: ToolManifest[] = [];
  const seen = new Set<string>();

  for (const [path, module] of Object.entries(manifestModules)) {
    const folder = folderOf(path);
    const manifest = module.default;

    // These invariants are what make the registry safe to trust everywhere
    // else. They run in dev and in the production build, and they fail loudly
    // rather than producing a tool that is silently unreachable.
    if (manifest.id !== folder) {
      throw new Error(
        `Tool manifest id "${manifest.id}" does not match its folder "${folder}". ` +
          'The id is the URL slug and must equal the folder name.',
      );
    }

    if (seen.has(manifest.id)) {
      throw new Error(`Duplicate tool id "${manifest.id}".`);
    }

    if (manifest.status === 'available' && !componentLoaders[`./${folder}/Tool.tsx`]) {
      throw new Error(
        `Tool "${manifest.id}" is marked available but has no Tool.tsx. ` +
          'Add the component, or set status to "planned".',
      );
    }

    if (manifest.processing === 'server' && !manifest.endpoint) {
      throw new Error(`Server tool "${manifest.id}" must declare an endpoint.`);
    }

    seen.add(manifest.id);
    manifests.push(manifest);
  }

  return manifests.sort((a, b) => a.name.localeCompare(b.name));
}

export const tools: readonly ToolManifest[] = buildRegistry();

const byId = new Map(tools.map((tool) => [tool.id, tool]));

export function getTool(id: string): ToolManifest | undefined {
  return byId.get(id);
}

/** Dynamically imports a tool's UI. Returns `null` for tools without one. */
export function loadToolComponent(
  id: string,
): (() => Promise<ToolModule>) | null {
  return componentLoaders[`./${id}/Tool.tsx`] ?? null;
}

export function getToolsByCategory(category: ToolCategory): ToolManifest[] {
  return tools.filter((tool) => tool.category === category);
}

/** Only categories that actually contain a tool are shown in the navigation. */
export function getActiveCategories() {
  return TOOL_CATEGORIES.filter((category) =>
    tools.some((tool) => tool.category === category),
  ).map((category) => ({
    ...CATEGORY_META[category],
    count: getToolsByCategory(category).length,
  }));
}

export function getFeaturedTools(limit = 6): ToolManifest[] {
  const available = tools.filter((tool) => tool.status === 'available');
  const featured = available.filter((tool) => tool.featured);

  return [...featured, ...available.filter((tool) => !tool.featured)].slice(0, limit);
}

/**
 * Ranked substring search over name, summary and keywords.
 *
 * Deliberately not fuzzy: with a catalog this size a predictable match beats a
 * clever one, and a name prefix should always win.
 */
export function searchTools(query: string): ToolManifest[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...tools];

  const scored: Array<{ tool: ToolManifest; score: number }> = [];

  for (const tool of tools) {
    const name = tool.name.toLowerCase();
    let score = 0;

    if (name === needle) score = 100;
    else if (name.startsWith(needle)) score = 80;
    else if (name.includes(needle)) score = 60;
    else if (tool.keywords.some((keyword) => keyword.toLowerCase().includes(needle))) score = 40;
    else if (tool.summary.toLowerCase().includes(needle)) score = 20;

    if (score > 0) {
      // Tools you can actually use outrank ones that are still planned.
      scored.push({ tool, score: tool.status === 'available' ? score + 5 : score });
    }
  }

  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.tool);
}
