import { useSearchParams } from 'react-router-dom';
import { CATEGORY_META, type ToolCategory } from '@convyx/tool-contract';
import { usePageMeta } from '@/hooks/usePageMeta';
import { ToolFinder } from '@/components/marketing/ToolFinder';

/**
 * The full catalog. Query and category live in the URL, so a filtered view is
 * shareable, survives a reload, and the back button behaves as expected.
 */
export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const category = params.get('category') as ToolCategory | null;

  usePageMeta({
    title: category ? `${CATEGORY_META[category].label} tools — Convyx` : 'All tools — Convyx',
    description: category
      ? CATEGORY_META[category].tagline
      : 'Every Convyx tool for PDFs and images, in one place.',
  });

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl sm:text-4xl">
        {category ? `${CATEGORY_META[category].label} tools` : 'All tools'}
      </h1>
      <p className="text-fg-muted mt-3 max-w-xl text-pretty">
        {category
          ? CATEGORY_META[category].tagline
          : 'Every tool, with what happens to your file marked on each card.'}
      </p>

      <ToolFinder
        className="mt-10"
        query={query}
        onQueryChange={(value) => update('q', value || null)}
        category={category}
        onCategoryChange={(value) => update('category', value)}
      />
    </div>
  );
}
