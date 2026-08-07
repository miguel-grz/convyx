import { Suspense, lazy, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileCheck2, HardDrive, Laptop, Server, Weight } from 'lucide-react';
import { CATEGORY_META } from '@convyx/tool-contract';
import { getTool, getToolsByCategory, loadToolComponent } from '@/tools/registry';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { ToolCard } from '@/components/layout/ToolCard';
import { ToolSkeleton } from '@/components/feedback/ToolSkeleton';
import { NotFoundPage } from './NotFoundPage';

/**
 * One page renders every tool. It owns the chrome — heading, spec strip, the
 * privacy note, related tools — and the tool's own module supplies only the part
 * that differs, which is what keeps adding a tool to three files.
 */
export function ToolPage() {
  const { toolId = '' } = useParams();
  const manifest = getTool(toolId);

  const ToolComponent = useMemo(() => {
    const loader = manifest ? loadToolComponent(manifest.id) : null;
    return loader ? lazy(loader) : null;
  }, [manifest]);

  usePageMeta({
    title: manifest ? `${manifest.name} — Convyx` : 'Not found — Convyx',
    description: manifest?.summary,
  });

  if (!manifest) return <NotFoundPage />;

  const category = CATEGORY_META[manifest.category];
  const related = getToolsByCategory(manifest.category)
    .filter((tool) => tool.id !== manifest.id)
    .slice(0, 4);

  const fileCount =
    manifest.files.max === null
      ? `${manifest.files.min} or more`
      : manifest.files.max === manifest.files.min
        ? `${manifest.files.min}`
        : `${manifest.files.min}–${manifest.files.max}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to={`/tools?category=${manifest.category}`}
        className="text-fg-muted hover:text-fg inline-flex items-center gap-1.5 text-sm transition-colors duration-150"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {category.label} tools
      </Link>

      <header data-category={manifest.category} className="mt-6 flex items-start gap-4">
        <span className="cat-tint flex size-12 shrink-0 items-center justify-center rounded-xl">
          <Icon name={manifest.icon} className="size-6" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl">{manifest.name}</h1>
            {manifest.status === 'planned' ? (
              <Badge variant="outline">Coming soon</Badge>
            ) : manifest.processing === 'client' ? (
              <Badge variant="ok">
                <Laptop />
                Runs in your browser
              </Badge>
            ) : (
              <Badge variant="neutral">
                <Server />
                Processed on our server
              </Badge>
            )}
          </div>
          <p className="text-fg-muted mt-3 text-pretty">{manifest.description}</p>
        </div>
      </header>

      {/* The spec strip answers "will my file even work here" before the picker. */}
      <dl className="border-line bg-bg-panel mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-3">
        <Spec
          icon={FileCheck2}
          label="Accepts"
          value={Object.values(manifest.accepts.mimeTypes).flat().join(', ')}
        />
        <Spec icon={HardDrive} label="Files at once" value={fileCount} />
        <Spec icon={Weight} label="Max size" value={`${manifest.maxFileSizeMB} MB each`} />
      </dl>

      <section className="mt-8" aria-label={manifest.name}>
        {ToolComponent ? (
          <Suspense fallback={<ToolSkeleton />}>
            <ToolComponent manifest={manifest} />
          </Suspense>
        ) : (
          <div className="border-line bg-bg-panel rounded-xl border border-dashed p-12 text-center">
            <h2 className="text-lg">This tool is not ready yet</h2>
            <p className="text-fg-muted mx-auto mt-2 max-w-sm text-sm text-pretty">
              It is on the roadmap, and this is the page it will ship into. In the meantime, the
              tools marked “On device” are ready to use.
            </p>
            <Link
              to="/tools"
              className="text-brand mt-5 inline-block text-sm font-medium hover:underline"
            >
              Browse working tools →
            </Link>
          </div>
        )}
      </section>

      <p className="text-fg-subtle mt-5 text-xs text-pretty">
        {manifest.processing === 'client'
          ? 'This tool reads your file on this device. Nothing is uploaded, so there is nothing for us to keep.'
          : 'Your file is sent over HTTPS, processed, and deleted within one hour — sooner once you download the result.'}
      </p>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg">More {category.label} tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({
  icon: IconComponent,
  label,
  value,
}: {
  icon: typeof FileCheck2;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-bg-panel p-4">
      <dt className="text-fg-subtle flex items-center gap-1.5 text-xs font-medium">
        <IconComponent className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm" title={value}>
        {value}
      </dd>
    </div>
  );
}
