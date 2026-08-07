import { icons } from 'virtual:convyx-icons';
import { cn } from '@/lib/cn';

/**
 * Manifests name their icon as a string, so the shell cannot know which icons
 * exist. The `convyx:icons` Vite plugin closes that gap at build time: it reads
 * the names out of the manifests and generates this map, so the decoupling
 * survives and the bundle still only carries the ~30 icons in use.
 */
export function Icon({ name, className }: { name: string; className?: string }) {
  const Glyph = icons[name];
  const classes = cn('size-5 shrink-0', className);

  // A manifest naming an icon that does not exist should be visible in review,
  // not a crash for the visitor.
  if (!Glyph) {
    if (import.meta.env.DEV) console.warn(`Unknown icon "${name}" in a tool manifest.`);
    return <span className={classes} aria-hidden />;
  }

  return <Glyph className={classes} aria-hidden strokeWidth={1.75} />;
}
