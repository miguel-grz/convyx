import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { CATEGORY_META, type ToolCategory, type ToolManifest } from '@convyx/tool-contract';
import { getActiveCategories, searchTools } from '@/tools/registry';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ToolCard } from '@/components/layout/ToolCard';
import { EmptyState } from '@/components/feedback/EmptyState';

interface ToolFinderProps {
  query: string;
  onQueryChange: (query: string) => void;
  category: ToolCategory | null;
  onCategoryChange: (category: ToolCategory | null) => void;
  className?: string;
}

/**
 * Search plus category tabs over the tool grid — the part of the page people
 * actually came for.
 *
 * Filtering is instant and local because the whole catalogue is already in
 * memory as manifests; there is no request to debounce and no spinner to show.
 */
export function ToolFinder({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  className,
}: ToolFinderProps) {
  const categories = getActiveCategories();

  const results = useMemo(() => {
    const matches = searchTools(query);
    return category ? matches.filter((tool) => tool.category === category) : matches;
  }, [query, category]);

  /**
   * With "All" selected the registry's alphabetical order interleaves the
   * categories — Compress image between Compress PDF and Convert image — which
   * reads as an unsorted pile. Grouping restores the structure without hiding
   * anything behind a default tab. A search or a chosen category is already
   * narrow, so those stay a single flat grid.
   */
  const grouped = !category && !query.trim();

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter tools by category"
          className="bg-bg-raised flex gap-1 self-start rounded-lg p-1"
        >
          <Tab active={!category} onClick={() => onCategoryChange(null)}>
            All
          </Tab>
          {categories.map((entry) => (
            <Tab
              key={entry.id}
              active={category === entry.id}
              categoryId={entry.id}
              onClick={() => onCategoryChange(entry.id)}
            >
              <Icon name={CATEGORY_META[entry.id].icon} className="size-4" />
              {entry.label}
            </Tab>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search
            className="text-fg-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            aria-label="Search tools"
            placeholder="Search tools…"
            onChange={(event) => onQueryChange(event.target.value)}
            className="border-line-strong bg-bg-panel placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border pr-9 pl-9 text-sm transition-colors duration-150"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-0.5 size-8 -translate-y-1/2"
              aria-label="Clear search"
              onClick={() => onQueryChange('')}
            >
              <X />
            </Button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title={`No tool matches “${query}”`}
          description="Try the file format instead of the task — searching “pdf” or “webp” finds more than a verb does."
          action={
            <Button variant="secondary" onClick={() => onQueryChange('')}>
              Clear search
            </Button>
          }
        />
      ) : grouped ? (
        <div className="mt-10 space-y-12">
          {categories.map((entry) => {
            const inCategory = order(results.filter((tool) => tool.category === entry.id));
            if (inCategory.length === 0) return null;

            return (
              <section key={entry.id} aria-labelledby={`group-${entry.id}`}>
                <div
                  data-category={entry.id}
                  className="border-line flex items-center gap-3 border-b pb-3"
                >
                  <span className="cat-tint flex size-8 items-center justify-center rounded-lg">
                    <Icon name={CATEGORY_META[entry.id].icon} className="size-4" />
                  </span>
                  <h3 id={`group-${entry.id}`} className="text-lg">
                    {CATEGORY_META[entry.id].label}
                  </h3>
                  <span className="text-fg-subtle text-sm">{inCategory.length}</span>
                </div>

                <Grid tools={inCategory} className="mt-5" />
              </section>
            );
          })}
        </div>
      ) : (
        <>
          <p aria-live="polite" className="text-fg-muted mt-5 text-sm">
            {results.length} {results.length === 1 ? 'tool' : 'tools'}
            {query && ` matching “${query}”`}
          </p>
          <Grid tools={order(results)} className="mt-4" />
        </>
      )}
    </div>
  );
}

/** Working tools first, then alphabetical — what you can use should be findable. */
function order(tools: ToolManifest[]): ToolManifest[] {
  return [...tools].sort(
    (a, b) =>
      Number(b.status === 'available') - Number(a.status === 'available') ||
      a.name.localeCompare(b.name),
  );
}

function Grid({ tools, className }: { tools: ToolManifest[]; className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

function Tab({
  active,
  categoryId,
  onClick,
  children,
}: {
  active: boolean;
  categoryId?: ToolCategory;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-category={categoryId}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150',
        active
          ? 'bg-bg-panel text-fg shadow-soft [&_svg]:text-[color:var(--cat-color,var(--brand))]'
          : 'text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
