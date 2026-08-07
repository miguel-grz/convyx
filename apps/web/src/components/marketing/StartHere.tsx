import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { tools } from '@/tools/registry';
import { useReveal } from '@/hooks/useReveal';
import { ToolCard } from '@/components/layout/ToolCard';

const SHOWN = 8;

/**
 * A short list of tools, so the landing page offers a way in without carrying
 * the whole catalogue.
 *
 * Deliberately not called "most popular": nothing is deployed and there is no
 * usage data, so a ranking would be invented. The selection is the `featured`
 * flag on the manifests — an editorial choice we can stand behind — with
 * working tools first so the one that runs today leads.
 */
export function StartHere() {
  const heading = useReveal<HTMLDivElement>();

  const picks = tools
    .filter((tool) => tool.featured)
    .sort(
      (a, b) =>
        Number(b.status === 'available') - Number(a.status === 'available') ||
        a.name.localeCompare(b.name),
    )
    .slice(0, SHOWN);

  return (
    <section className="border-line border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div ref={heading} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl text-balance sm:text-4xl">Start here</h2>
            <p className="text-fg-muted mt-4 text-pretty">
              The jobs that bring most people to a site like this one. If yours is not among them,
              the full list is one click away.
            </p>
          </div>

          <Link
            to="/tools"
            className="text-brand group flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
          >
            See all {tools.length} tools
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((tool, index) => (
            <Pick key={tool.id} tool={tool} delay={index * 60} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Pick({ tool, delay }: { tool: (typeof tools)[number]; delay: number }) {
  const ref = useReveal<HTMLDivElement>({ delay });

  return (
    <div ref={ref}>
      <ToolCard tool={tool} />
    </div>
  );
}
