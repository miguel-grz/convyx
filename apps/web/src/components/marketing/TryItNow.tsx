import { Suspense, lazy, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedTools, loadToolComponent } from '@/tools/registry';
import { useReveal } from '@/hooks/useReveal';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { ToolSkeleton } from '@/components/feedback/ToolSkeleton';

/**
 * The claim, demonstrated instead of stated: a real tool, running on the landing
 * page, doing the job without a network request.
 *
 * Which tool is not hardcoded — the registry ranks it — so this section keeps
 * working as the catalog grows.
 */
export function TryItNow() {
  const [tool] = getFeaturedTools(1);
  const ref = useReveal<HTMLDivElement>();

  const ToolComponent = useMemo(() => {
    const loader = tool ? loadToolComponent(tool.id) : null;
    return loader ? lazy(loader) : null;
  }, [tool]);

  if (!tool || !ToolComponent) return null;

  return (
    <section className="border-line border-b">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16">
        <div ref={ref} className="lg:self-center">
          <Badge variant="ok">Working right now</Badge>

          <h2 className="mt-4 text-3xl text-balance sm:text-4xl">
            Try it without leaving this page
          </h2>

          <p className="text-fg-muted mt-5 max-w-md text-pretty">
            This is the real {tool.name} tool, not a picture of one. Drop two PDFs in and watch your
            browser's network tab stay completely empty — the file is read, merged and written back
            on your own machine.
          </p>

          <Link
            to={`/tools/${tool.id}`}
            className="text-brand mt-6 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            Open {tool.name} on its own page →
          </Link>
        </div>

        <div
          data-category={tool.category}
          className="border-line bg-bg-panel shadow-card rounded-2xl border p-5 sm:p-6"
        >
          <div className="border-line mb-5 flex items-center gap-3 border-b pb-4">
            <span className="cat-tint flex size-9 items-center justify-center rounded-lg">
              <Icon name={tool.icon} />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{tool.name}</p>
              <p className="text-fg-subtle truncate text-xs">{tool.summary}</p>
            </div>
          </div>

          <Suspense fallback={<ToolSkeleton />}>
            <ToolComponent manifest={tool} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
