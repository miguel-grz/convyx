import { Laptop, Server } from 'lucide-react';
import { tools } from '@/tools/registry';
import { usePageMeta } from '@/hooks/usePageMeta';

/**
 * Both lists are generated from the registry rather than written by hand, so
 * this page cannot drift from what the app does. Phase 7 hardens the server half
 * of these claims; the on-device half already holds.
 */
export function PrivacyPage() {
  const local = tools.filter((tool) => tool.processing === 'client');
  const remote = tools.filter((tool) => tool.processing === 'server');

  usePageMeta({
    title: 'Privacy — Convyx',
    description: 'What happens to your file, tool by tool.',
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl sm:text-4xl">Privacy</h1>
      <p className="text-fg-muted mt-4 text-lg text-pretty">
        Short version: {local.length} of our {tools.length} tools never send your file anywhere. The
        rest delete it within an hour.
      </p>

      <div className="mt-12 space-y-12">
        <section>
          <h2 className="flex items-center gap-2.5 text-xl">
            <Laptop className="text-ok size-5" aria-hidden />
            Tools that never upload
          </h2>
          <p className="text-fg-muted mt-3 text-sm text-pretty">
            These read your file directly in this tab. There is no upload, so there is nothing for
            us to store, log, or lose. You can confirm it yourself: open your browser's network tab
            and watch it stay empty while the job runs.
          </p>
          <ul className="text-fg mt-5 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {local.map((tool) => (
              <li key={tool.id}>{tool.name}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="flex items-center gap-2.5 text-xl">
            <Server className="text-fg-muted size-5" aria-hidden />
            Tools that use our server
          </h2>
          <p className="text-fg-muted mt-3 text-sm text-pretty">
            Some jobs need software a browser cannot run — OCR, Office conversion, the
            background-removal model. For those, your file is sent over HTTPS, processed, and
            deleted. Deletion is enforced by a scheduled sweep, not by us remembering to do it.
          </p>
          <ul className="text-fg mt-5 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {remote.map((tool) => (
              <li key={tool.id}>{tool.name}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl">What we do not do</h2>
          <ul className="text-fg-muted mt-4 list-disc space-y-2 pl-5 text-sm">
            <li>No accounts, so nothing is tied to an identity.</li>
            <li>No advertising and no third-party trackers.</li>
            <li>No reading, indexing, or training on what is in your files.</li>
            <li>No retention beyond the processing window.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
