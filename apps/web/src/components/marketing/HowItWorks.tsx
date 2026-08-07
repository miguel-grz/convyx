import { Download, MousePointerClick, Upload } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Pick a tool',
    body: 'Search for what you need or browse the list. Each tool tells you which files it takes, and how large, before you pick one.',
  },
  {
    icon: Upload,
    title: 'Add your file',
    body: 'Drag it into the box or click to pick it. For most tools your file never leaves your computer, so there is no upload to sit through.',
  },
  {
    icon: Download,
    title: 'Download the result',
    body: 'The finished file is yours straight away — no watermark, no email required, and nothing kept afterwards.',
  },
];

/** Three steps, numbered because the order genuinely matters here. */
export function HowItWorks() {
  return (
    <section className="border-line border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl text-balance sm:text-4xl">
          Three steps, about ten seconds
        </h2>

        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Step key={step.title} step={step} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const ref = useReveal<HTMLLIElement>({ delay: index * 110 });
  const IconComponent = step.icon;

  return (
    <li ref={ref} className="relative text-center md:text-left">
      <span className="bg-brand-soft text-brand mx-auto flex size-12 items-center justify-center rounded-xl md:mx-0">
        <IconComponent className="size-5" aria-hidden />
      </span>

      <p className="text-fg-subtle mt-5 text-sm font-medium tabular-nums">
        Step {index + 1}
      </p>
      <h3 className="mt-1 text-lg">{step.title}</h3>
      <p className="text-fg-muted mx-auto mt-2 max-w-xs text-sm text-pretty md:mx-0">{step.body}</p>
    </li>
  );
}
