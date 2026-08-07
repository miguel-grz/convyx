import { Link } from 'react-router-dom';
import { Laptop, Server } from 'lucide-react';
import { tools } from '@/tools/registry';
import { useReveal } from '@/hooks/useReveal';

/**
 * The privacy claim with its own numbers attached. Both lists come from the
 * registry, so this section cannot overstate the promise — a tool that moves to
 * the server moves across this comparison by itself.
 */
export function PrivacyStrip() {
  const ref = useReveal<HTMLDivElement>();

  const local = tools.filter((tool) => tool.processing === 'client');
  const remote = tools.filter((tool) => tool.processing === 'server');

  return (
    <section className="border-line border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl text-balance sm:text-4xl">Where your file actually goes</h2>
          <p className="text-fg-muted mt-5 text-pretty">
            Most tool sites upload everything, which is why they all need a retention policy you
            have to trust. Here is the honest split, generated from the tools themselves.
          </p>
        </div>

        <div ref={ref} className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="border-ok/25 bg-ok-soft/40 rounded-2xl border p-6 sm:p-8">
            <span className="bg-ok/15 text-ok flex size-11 items-center justify-center rounded-xl">
              <Laptop className="size-5" aria-hidden />
            </span>
            <h3 className="mt-5 text-xl">
              {local.length} tools stay on your device
              <span className="sr-only"> of {tools.length} total</span>
            </h3>
            <p className="text-fg-muted mt-2 text-sm text-pretty">
              Read, transformed and written back inside this tab. There is no upload, so there is
              nothing for us to store, log or lose.
            </p>
            <ul className="text-fg mt-6 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {local.map((tool) => (
                <li key={tool.id} className="truncate">
                  {tool.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-line bg-bg-panel rounded-2xl border p-6 sm:p-8">
            <span className="bg-bg-raised text-fg-muted flex size-11 items-center justify-center rounded-xl">
              <Server className="size-5" aria-hidden />
            </span>
            <h3 className="mt-5 text-xl">{remote.length} tools need our server</h3>
            <p className="text-fg-muted mt-2 text-sm text-pretty">
              OCR, Office conversion and background removal need software a browser cannot run. Your
              file is sent over HTTPS, processed, then deleted by a scheduled sweep within the hour.
            </p>
            <ul className="text-fg mt-6 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {remote.map((tool) => (
                <li key={tool.id} className="truncate">
                  {tool.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center">
          <Link to="/privacy" className="text-brand text-sm font-medium hover:underline">
            Read the full privacy page →
          </Link>
        </p>
      </div>
    </section>
  );
}
