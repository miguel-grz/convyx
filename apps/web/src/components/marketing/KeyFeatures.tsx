import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ban, Gauge, Laptop, Timer } from 'lucide-react';
import { CATEGORY_META } from '@convyx/tool-contract';
import { getActiveCategories, tools } from '@/tools/registry';
import { cn } from '@/lib/cn';
import { useReveal } from '@/hooks/useReveal';
import { useCountUp } from '@/hooks/useCountUp';
import { Icon } from '@/components/ui/icon';

/**
 * What the product is, in five tiles.
 *
 * This replaced a grid of every tool. A catalogue grid is the right thing on
 * /tools, where finding a tool is the job, but on the landing page it grew with
 * the catalogue and pushed everything that explains the product below the fold.
 * Five claims do not grow; 26 cards become 60.
 *
 * The tiles are deliberately different sizes and each carries its own small
 * animation, because a row of identical icon-heading-text cards is the layout
 * this section exists to avoid.
 */
export function KeyFeatures() {
  const local = tools.filter((tool) => tool.processing === 'client').length;

  return (
    <section id="features" className="border-line border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl text-balance sm:text-4xl">Built to be the boring choice</h2>
          <p className="text-fg-muted mt-4 text-pretty">
            No sign-up wall, no upload you did not ask for, and no tab frozen for thirty seconds.
            Open a tool, get the file, close the tab.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <Tile
            className="lg:col-span-2"
            delay={0}
            icon={Laptop}
            title={`${local} of ${tools.length} tools never upload anything`}
            body="Merging, splitting and converting happen inside this tab, on your own machine. There is no file on a server to retain, log or leak — not as a policy, but because it never arrives."
            visual={<DeviceBoundary />}
          />

          <Tile
            delay={90}
            icon={Ban}
            title="Nothing asked of you"
            body="No account, no email, no watermark on the way out, and no tool held back behind a plan."
            visual={<NothingAsked />}
          />

          <Tile
            delay={180}
            icon={Timer}
            title="Deleted within the hour"
            body="When a job genuinely needs a server, a scheduled sweep removes the file — usually the moment you download it."
            visual={<RetentionRing />}
          />

          <Tile
            delay={270}
            icon={Gauge}
            title="The tab never freezes"
            body="Heavy work runs off the main thread, with real progress and a cancel button that actually stops the job mid-run."
            visual={<WorkerProgress />}
          />

          <CatalogTile delay={360} />
        </div>
      </div>
    </section>
  );
}

interface TileProps {
  icon: typeof Laptop;
  title: string;
  body: string;
  visual: ReactNode;
  delay: number;
  className?: string;
}

function Tile({ icon: IconComponent, title, body, visual, delay, className }: TileProps) {
  const ref = useReveal<HTMLDivElement>({ delay });

  return (
    <div
      ref={ref}
      className={cn(
        'group border-line bg-bg-panel hover:border-line-strong flex flex-col overflow-hidden rounded-2xl border transition-colors duration-200',
        className,
      )}
    >
      <div className="p-6">
        <span className="bg-brand-soft text-brand flex size-10 items-center justify-center rounded-xl">
          <IconComponent className="size-5" aria-hidden />
        </span>
        <h3 className="mt-5 text-lg text-balance">{title}</h3>
        <p className="text-fg-muted mt-2 text-sm text-pretty">{body}</p>
      </div>

      <div className="mt-auto px-6 pb-6">{visual}</div>
    </div>
  );
}

/**
 * The mechanism, animated: a file sets off for the server, reaches the edge of
 * the device and returns. The boundary lights up on contact.
 */
function DeviceBoundary() {
  return (
    <div className="bg-bg-inset relative h-32 overflow-hidden rounded-xl px-4 pt-5" aria-hidden>
      <p className="text-fg-subtle absolute top-3 right-4 text-[0.625rem]">
        your device ends here
      </p>

      <div className="flex h-[calc(100%-1.25rem)] items-center gap-3">
        {/* The track defines the travel: the file animates to its far edge, so
            the bounce lands on the boundary at any width. */}
        <div className="relative h-9 flex-1">
          <span className="border-line-strong bg-bg-panel motion-safe:animate-[file-returns_4.5s_cubic-bezier(0.5,0,0.3,1)_infinite] absolute top-0 left-0 flex h-9 w-28 items-center gap-2 rounded-lg border px-3">
            <span className="bg-brand size-1.5 shrink-0 rounded-full" />
            <span className="text-fg-muted truncate text-xs">report.pdf</span>
          </span>
        </div>

        <span className="border-brand motion-safe:animate-[barrier-hit_4.5s_ease-in-out_infinite] h-16 shrink-0 border-l-2 border-dashed opacity-35" />

        <div className="text-fg-subtle flex shrink-0 flex-col items-center gap-1 opacity-40">
          <span className="border-line-strong size-8 rounded-md border border-dashed" />
          <span className="text-[0.625rem]">server</span>
        </div>
      </div>
    </div>
  );
}

/** Three things other tools ask for, struck through. */
function NothingAsked() {
  return (
    <ul className="bg-bg-inset space-y-2 rounded-xl p-4" aria-hidden>
      {['Email address', 'Payment details', 'Watermark on export'].map((item) => (
        <li key={item} className="text-fg-subtle flex items-center gap-2.5 text-xs">
          <span className="bg-line-strong h-px w-4" />
          <span className="line-through decoration-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** The retention window, unwinding to nothing. */
function RetentionRing() {
  const length = 2 * Math.PI * 26;

  return (
    <div className="bg-bg-inset flex h-28 items-center justify-center rounded-xl" aria-hidden>
      <div className="relative">
        <svg viewBox="0 0 64 64" className="size-20 -rotate-90">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--line-strong)" strokeWidth="4" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={length}
            className="motion-safe:animate-[ring-empties_4s_linear_infinite]"
            style={{ '--ring-length': length } as React.CSSProperties}
          />
        </svg>
        <span className="text-fg-muted absolute inset-0 flex items-center justify-center text-xs">
          1 h
        </span>
      </div>
    </div>
  );
}

/** A worker running, with the control that stops it. */
function WorkerProgress() {
  return (
    <div className="bg-bg-inset space-y-3 rounded-xl p-4" aria-hidden>
      <div className="text-fg-subtle flex items-center justify-between text-xs">
        <span>Merging 12 pages…</span>
        <span className="border-line-strong rounded border px-1.5 py-0.5 text-[0.625rem]">
          Cancel
        </span>
      </div>
      <div className="bg-bg-raised relative h-1.5 overflow-hidden rounded-full">
        <span className="bg-brand motion-safe:animate-[indeterminate_1.6s_ease-in-out_infinite] absolute inset-y-0 w-1/3 rounded-full" />
      </div>
      <p className="text-fg-subtle text-[0.625rem]">Web Worker · main thread idle</p>
    </div>
  );
}

/** The catalogue as one number, so the landing page stops growing with it. */
function CatalogTile({ delay }: { delay: number }) {
  const reveal = useReveal<HTMLAnchorElement>({ delay });
  const counter = useCountUp<HTMLParagraphElement>(tools.length);
  const categories = getActiveCategories();

  return (
    <Link
      ref={reveal}
      to="/tools"
      className="group border-line bg-bg-panel hover:border-brand/40 hover:shadow-card flex flex-col justify-between rounded-2xl border p-6 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5"
    >
      <div>
        <p ref={counter.ref} className="text-brand text-5xl font-semibold tabular-nums">
          {counter.value}
        </p>
        <h3 className="mt-2 text-lg">tools, one place</h3>
        <p className="text-fg-muted mt-2 text-sm text-pretty">
          {categories.map((category) => CATEGORY_META[category.id].label).join(' and ')} today, with
          audio and video next.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex -space-x-2">
          {tools
            .filter((tool) => tool.featured)
            .slice(0, 4)
            .map((tool) => (
              <span
                key={tool.id}
                data-category={tool.category}
                className="cat-tint border-bg-panel flex size-8 items-center justify-center rounded-lg border-2"
              >
                <Icon name={tool.icon} className="size-3.5" />
              </span>
            ))}
        </div>

        <span className="text-brand flex items-center gap-1.5 text-sm font-medium">
          Browse all
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
