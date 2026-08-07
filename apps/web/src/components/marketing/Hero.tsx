import { Link } from 'react-router-dom';
import { ArrowRight, Laptop, UserX, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useReveal } from '@/hooks/useReveal';
import { useParallax } from '@/hooks/useParallax';
import { buttonVariants } from '@/components/ui/button-variants';
import { ToolSearch } from './ToolSearch';

/**
 * Headline, one sentence, and the search box — the fastest path to the tool the
 * visitor already has in mind. Everything below is for people who do not.
 */
export function Hero() {
  const copy = useReveal<HTMLDivElement>();
  const glow = useParallax<HTMLDivElement>({ speed: 40 });

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
          Merge, split, convert and compress in seconds — free, with no account. Most tools work
          right on your screen, so your files stay yours.
        </p>

        <ToolSearch className="mx-auto mt-9 max-w-md" />

        <ul className="text-fg-muted mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm">
          <li className="flex items-center gap-2">
            <Laptop className="text-ok size-4" aria-hidden />
            Your files stay private
          </li>
          <li className="flex items-center gap-2">
            <Zap className="text-ok size-4" aria-hidden />
            Ready in seconds
          </li>
          <li className="flex items-center gap-2">
            <UserX className="text-ok size-4" aria-hidden />
            Free, no sign-up
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
