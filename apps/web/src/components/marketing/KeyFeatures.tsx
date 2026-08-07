import type { ReactNode } from 'react';
import { Ban, Check, Laptop, MonitorSmartphone, Timer } from 'lucide-react';
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
 * The copy here is written for someone who arrived with a broken file, not for
 * someone evaluating the build. No servers, no workers, no uploads — those words
 * describe our problem, not theirs.Each claim is a result they can feel: it is
 * private, it is instant, it is free, there is nothing to install. The
 * mechanism is documented for the people who want it, in the README, the ADRs
 * and the privacy page.
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
          <h2 className="text-3xl text-balance sm:text-4xl">Private, instant, and free</h2>
          <p className="text-fg-muted mt-4 text-pretty">
            No account to create, no waiting around, and no watermark stamped on your file. Pick a
            tool, drop your file in, done.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <Tile
            className="lg:col-span-2"
            delay={0}
            icon={Laptop}
            title="Your files stay on your computer"
            body={`Most of what we do happens right here on your screen — ${local} of our ${tools.length} tools never send your file anywhere. That keeps it private, and it means your result is ready the moment you click.`}
            visual={<DeviceBoundary />}
          />

          <Tile
            delay={90}
            icon={Ban}
            title="Free, and nothing to sign up for"
            body="No account, no email, no card. Every tool is free, and your file comes back without a watermark on it."
            visual={<NothingAsked />}
          />

          <Tile
            delay={180}
            icon={Timer}
            title="We never keep your files"
            body="A few tools need a hand from us to do the heavy lifting. Those files are wiped within the hour, automatically — usually the second you download the result."
            visual={<RetentionRing />}
          />

          <Tile
            delay={270}
            icon={MonitorSmartphone}
            title="Nothing to install"
            body="It works in the browser you already have, on a laptop or a phone. No download, no plugin, no setup."
            visual={<NoInstall />}
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
      <div className="text-fg-subtle absolute inset-x-4 top-3 flex justify-between text-[0.625rem]">
        <span>your computer</span>
        <span>the internet</span>
      </div>

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
          <span className="text-[0.625rem]">never sent</span>
        </div>
      </div>
    </div>
  );
}

/** Three things other tools ask for, struck through. */
function NothingAsked() {
  return (
    <ul className="bg-bg-inset space-y-2 rounded-xl p-4" aria-hidden>
      {['Create an account', 'Add a card', 'Watermark on your file'].map((item) => (
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

/** The browser they already have, with nothing added to it. */
function NoInstall() {
  return (
    <div className="bg-bg-inset space-y-3 rounded-xl p-4" aria-hidden>
      <div className="border-line bg-bg-panel overflow-hidden rounded-lg border">
        <div className="border-line flex items-center gap-1.5 border-b px-2.5 py-2">
          <span className="bg-line-strong size-1.5 rounded-full" />
          <span className="bg-line-strong size-1.5 rounded-full" />
          <span className="bg-line-strong size-1.5 rounded-full" />
          <span className="bg-bg-raised text-fg-subtle ml-1.5 flex-1 truncate rounded px-2 py-0.5 text-[0.625rem]">
            convyx.app
          </span>
        </div>
        <p className="text-fg-muted px-3 py-3 text-xs">Open the page. That is the install.</p>
      </div>

      <ul className="text-fg-subtle flex flex-wrap gap-x-4 gap-y-1 text-[0.625rem]">
        {['Laptop', 'Phone', 'Tablet'].map((device) => (
          <li key={device} className="flex items-center gap-1">
            <Check className="text-ok size-3" />
            {device}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The catalogue as one number.
 *
 * Not a link: "Start here" sits directly below and owns the way into the
 * catalogue. Two doors to the same room, one screen apart, is a choice the
 * visitor should not have to make.
 */
function CatalogTile({ delay }: { delay: number }) {
  const reveal = useReveal<HTMLDivElement>({ delay });
  const counter = useCountUp<HTMLParagraphElement>(tools.length);
  const categories = getActiveCategories();

  return (
    <div
      ref={reveal}
      className="border-line bg-bg-panel flex flex-col justify-between rounded-2xl border p-6"
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

      <div className="mt-6 flex -space-x-2">
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
    </div>
  );
}
