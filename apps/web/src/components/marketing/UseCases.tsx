import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getTool } from '@/tools/registry';
import { cn } from '@/lib/cn';
import { useReveal } from '@/hooks/useReveal';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';

/**
 * The situations people are actually in when they end up here.
 *
 * Someone who needs to combine five PDFs does not search for "merge" — they
 * search for whatever the upload form just refused to accept. Leading with the
 * problem, in the words the problem arrives in, is what turns a visitor who does
 * not know our vocabulary into someone holding the right tool.
 *
 * Each card opens with the message that sent them looking, mocked up the way
 * they saw it, so the scenario is recognised before it is read.
 */
const SCENARIOS = [
  {
    toolId: 'pdf-merge',
    problem: 'Only one file can be uploaded.',
    story: 'The application form takes a single attachment, and you have five separate pages.',
  },
  {
    toolId: 'image-compress',
    problem: 'File too large — maximum 2 MB.',
    story: 'Your photo is straight off a phone camera, and the site will not take a 12 MB upload.',
  },
  {
    toolId: 'pdf-extract-pages',
    problem: 'Please submit only the signature page.',
    story: 'The contract runs to 40 pages and they want page 12, not the other 39.',
  },
  {
    toolId: 'pdf-ocr',
    problem: 'No results found.',
    story: 'You are searching a scanned document for a name, and it behaves like a photograph.',
  },
];

export function UseCases() {
  return (
    <section className="border-line border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl text-balance sm:text-4xl">Sound familiar?</h2>
          <p className="text-fg-muted mt-4 text-pretty">
            Nobody wakes up wanting to merge a PDF. You end up here because something else refused
            to work — so here is what to reach for when it does.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {SCENARIOS.map((scenario, index) => (
            <Scenario key={scenario.toolId} scenario={scenario} delay={index * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Scenario({
  scenario,
  delay,
}: {
  scenario: (typeof SCENARIOS)[number];
  delay: number;
}) {
  const ref = useReveal<HTMLAnchorElement>({ delay });
  const tool = getTool(scenario.toolId);

  if (!tool) return null;

  const planned = tool.status === 'planned';

  return (
    <Link
      ref={ref}
      to={`/tools/${tool.id}`}
      data-category={tool.category}
      className="group border-line bg-bg-panel hover:border-line-strong hover:shadow-card flex flex-col gap-5 rounded-2xl border p-6 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5"
    >
      {/* The refusal, dressed as the one they actually saw. */}
      <p className="border-danger/25 bg-danger-soft/60 text-danger flex items-center gap-2.5 self-start rounded-lg border px-3 py-2 text-sm">
        <span
          aria-hidden
          className="border-danger flex size-4 shrink-0 items-center justify-center rounded-full border text-[0.625rem] leading-none font-bold"
        >
          !
        </span>
        {scenario.problem}
      </p>

      <p className="text-fg-muted flex-1 text-pretty">{scenario.story}</p>

      <div className="border-line flex items-center gap-3 border-t pt-4">
        <span className="cat-tint flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon name={tool.icon} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-fg-subtle block text-xs">Use</span>
          <span className="group-hover:text-brand block truncate font-medium transition-colors duration-150">
            {tool.name}
          </span>
        </span>

        {planned ? (
          <Badge variant="outline">Soon</Badge>
        ) : (
          <span className="text-brand flex items-center gap-1.5 text-sm font-medium">
            Open
            <ArrowRight
              className={cn(
                'size-4 transition-transform duration-200 group-hover:translate-x-0.5',
              )}
              aria-hidden
            />
          </span>
        )}
      </div>
    </Link>
  );
}
