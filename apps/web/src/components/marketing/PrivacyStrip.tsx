import { Link } from 'react-router-dom';
import { Laptop, Server } from 'lucide-react';
import { tools } from '@/tools/registry';
import { useReveal } from '@/hooks/useReveal';
import { useCountUp } from '@/hooks/useCountUp';

/**
 * The split between what stays on your machine and what does not.
 *
 * Both sides are counted from the registry, so the section cannot overstate the
 * promise: move a tool to the server and it moves across this comparison by
 * itself. Only a handful of names are shown — the full lists live on the privacy
 * page, and printing 26 of them here is how this section would sprawl as the
 * catalogue grows.
 */
export function PrivacyStrip() {
  const local = tools.filter((tool) => tool.processing === 'client');
  const remote = tools.filter((tool) => tool.processing === 'server');

  return (
    <section className="border-line border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl text-balance sm:text-4xl">Where your file actually goes</h2>
          <p className="text-fg-muted mt-4 text-pretty">
            Most tool sites upload everything, which is why they all need a retention policy you
            have to trust. Here is the split, generated from the tools themselves.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Side
            delay={0}
            tone="ok"
            icon={Laptop}
            count={local.length}
            heading="stay on your device"
            body="Read, transformed and written back inside this tab. There is no upload, so there is nothing for us to store, log or lose."
            examples={local}
          />

          <Side
            delay={110}
            tone="neutral"
            icon={Server}
            count={remote.length}
            heading="need our server"
            body="OCR, Office conversion and background removal need software a browser cannot run. Sent over HTTPS, processed, then deleted by a scheduled sweep."
            examples={remote}
          />
        </div>

        <p className="mt-8 text-center">
          <Link to="/privacy" className="text-brand text-sm font-medium hover:underline">
            See exactly which tools do which →
          </Link>
        </p>
      </div>
    </section>
  );
}

function Side({
  delay,
  tone,
  icon: IconComponent,
  count,
  heading,
  body,
  examples,
}: {
  delay: number;
  tone: 'ok' | 'neutral';
  icon: typeof Laptop;
  count: number;
  heading: string;
  body: string;
  examples: typeof tools;
}) {
  const reveal = useReveal<HTMLDivElement>({ delay });
  const counter = useCountUp<HTMLSpanElement>(count);

  const shown = examples.slice(0, 4);
  const rest = examples.length - shown.length;

  return (
    <div
      ref={reveal}
      className={
        tone === 'ok'
          ? 'border-ok/25 bg-ok-soft/40 rounded-2xl border p-6 sm:p-8'
          : 'border-line bg-bg-panel rounded-2xl border p-6 sm:p-8'
      }
    >
      <span
        className={
          tone === 'ok'
            ? 'bg-ok/15 text-ok flex size-11 items-center justify-center rounded-xl'
            : 'bg-bg-raised text-fg-muted flex size-11 items-center justify-center rounded-xl'
        }
      >
        <IconComponent className="size-5" aria-hidden />
      </span>

      <h3 className="mt-5 text-xl">
        <span ref={counter.ref} className="tabular-nums">
          {counter.value}
        </span>{' '}
        {heading}
      </h3>

      <p className="text-fg-muted mt-2 text-sm text-pretty">{body}</p>

      <ul className="mt-6 flex flex-wrap gap-2">
        {shown.map((tool) => (
          <li
            key={tool.id}
            className="border-line bg-bg-panel text-fg-muted rounded-md border px-2.5 py-1 text-xs"
          >
            {tool.name}
          </li>
        ))}
        {rest > 0 && (
          <li className="text-fg-subtle px-1 py-1 text-xs">and {rest} more</li>
        )}
      </ul>
    </div>
  );
}
