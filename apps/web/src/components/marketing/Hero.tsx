import { Link } from 'react-router-dom';
import { ArrowRight, Laptop, Trash2, UserX } from 'lucide-react';
import { tools } from '@/tools/registry';
import { cn } from '@/lib/cn';
import { useReveal } from '@/hooks/useReveal';
import { useParallax } from '@/hooks/useParallax';
import { buttonVariants } from '@/components/ui/button-variants';
import { Icon } from '@/components/ui/icon';
import { ToolSearch } from './ToolSearch';

interface HeroProps {
  /**
   * One-click starting points. Planned tools are included and labelled rather
   * than hidden — with one tool shipped, a row of a single chip would read as a
   * mistake, and pretending the rest exist would be worse.
   */
  quickPicks: typeof tools;
}

/**
 * Headline, one sentence, and the search box — the fastest path to the tool the
 * visitor already has in mind. Everything below is for people who do not.
 */
export function Hero({ quickPicks }: HeroProps) {
  const copy = useReveal<HTMLDivElement>();
  const glow = useParallax<HTMLDivElement>({ speed: 40 });

  const local = tools.filter((tool) => tool.processing === 'client').length;

  return (
    <section className="border-line relative overflow-hidden border-b">
      {/* A single soft light source behind the headline. It drifts on scroll —
          the only ambient motion above the fold. */}
      <div
        ref={glow}
        aria-hidden
        className="bg-brand/12 pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full blur-[120px]"
      />

      <div ref={copy} className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h1 className="text-4xl text-balance sm:text-5xl lg:text-[3.5rem]">
          Every PDF and image tool you need
        </h1>

        <p className="text-fg-muted mx-auto mt-5 max-w-xl text-lg text-pretty">
          Merge, split, convert and compress in seconds. No account, no watermarks — and {local} of
          our {tools.length} tools never upload your file at all.
        </p>

        <ToolSearch className="mx-auto mt-9 max-w-md" />

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {quickPicks.map((tool) => (
            <Link
              key={tool.id}
              to={`/tools/${tool.id}`}
              data-category={tool.category}
              className={cn(
                'group border-line bg-bg-panel hover:border-line-strong hover:bg-bg-raised flex items-center gap-2 rounded-lg border py-1.5 pr-3 pl-2 text-sm font-medium transition-colors duration-150',
                tool.status === 'planned' && 'text-fg-muted',
              )}
            >
              <span className="cat-tint flex size-6 items-center justify-center rounded">
                <Icon name={tool.icon} className="size-3.5" />
              </span>
              {tool.name}
              {tool.status === 'planned' && (
                <span className="text-fg-subtle text-xs font-normal">soon</span>
              )}
            </Link>
          ))}
        </div>

        <ul className="text-fg-muted mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm">
          <li className="flex items-center gap-2">
            <Laptop className="text-ok size-4" aria-hidden />
            Runs in your browser
          </li>
          <li className="flex items-center gap-2">
            <Trash2 className="text-ok size-4" aria-hidden />
            Server files deleted in 1 hour
          </li>
          <li className="flex items-center gap-2">
            <UserX className="text-ok size-4" aria-hidden />
            No sign-up
          </li>
        </ul>

        <div className="mt-9">
          <Link to="/tools/pdf-merge" className={cn(buttonVariants({ size: 'lg' }), 'group')}>
            Try Merge PDF now
            <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
