import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const VIRTUAL_ID = 'virtual:convyx-icons';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/**
 * Ships only the icons the catalog actually names.
 *
 * `lucide-react/dynamic` keeps the registry decoupled from the app shell, but it
 * makes every icon in the library reachable, and the production build emits a
 * chunk for each — 1,600 files and 7 MB for the ~30 we use.
 *
 * This plugin gets both: it reads the `icon:` field out of every tool manifest
 * and the category table, then generates a module with exactly those imports.
 * Adding a tool still touches nothing but its own folder, and the bundle still
 * contains only what is referenced.
 */
export function convyxIcons(): Plugin {
  const roots = ['src/tools/*/manifest.ts', '../../packages/tool-contract/src/index.ts'];

  const collect = (dir: string): string[] => {
    const names = new Set<string>();

    for (const pattern of roots) {
      for (const file of globSync(pattern, { cwd: dir })) {
        const source = readFileSync(path.resolve(dir, file), 'utf8');
        for (const match of source.matchAll(/\bicon:\s*'([a-z0-9-]+)'/g)) {
          if (match[1]) names.add(match[1]);
        }
      }
    }

    return [...names].sort();
  };

  let root = process.cwd();

  return {
    name: 'convyx:icons',

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;

      const names = collect(root);
      const identifier = (name: string) =>
        `Icon${name.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) => char.toUpperCase())}`;
      const componentName = (name: string) =>
        name.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) => char.toUpperCase());

      const imports = names
        .map(
          (name) => `import { ${componentName(name)} as ${identifier(name)} } from 'lucide-react';`,
        )
        .join('\n');

      const entries = names.map((name) => `  '${name}': ${identifier(name)},`).join('\n');

      return `${imports}\n\nexport const icons = {\n${entries}\n};\n`;
    },

    // A new tool folder means a new icon; rebuild the module rather than making
    // the developer restart the dev server.
    handleHotUpdate({ file, server }) {
      if (!file.endsWith('manifest.ts') && !file.endsWith('tool-contract/src/index.ts')) return;

      const module = server.moduleGraph.getModuleById(RESOLVED_ID);
      if (module) server.moduleGraph.invalidateModule(module);
    },
  };
}

export const iconsVirtualId = VIRTUAL_ID;
