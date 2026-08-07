import { tools } from '@/tools/registry';
import { Accordion } from '@/components/ui/accordion';

/**
 * The questions someone actually asks before dropping a private document into a
 * website they found five seconds ago — answered in their words, not ours.
 * Specific throughout, including the uncomfortable one about how little of the
 * catalogue is finished.
 */
export function Faq() {
  const local = tools.filter((tool) => tool.processing === 'client').length;
  const available = tools.filter((tool) => tool.status === 'available');

  const questions = [
    {
      q: 'Are my files private?',
      a: `Yes. For ${local} of our ${tools.length} tools your file never leaves your computer — we never receive it, so there is nothing we could look at, share or lose. The rest need a hand from us to do the heavy lifting, and those are wiped within the hour.`,
    },
    {
      q: 'How long do you keep my files?',
      a: 'The ones we never receive, not at all. The ones we do handle are deleted within the hour, and usually the moment you download your result. It happens automatically, not because someone remembers to do it.',
    },
    {
      q: 'Is it really free?',
      a: 'Yes, and there is no account, no email and no card. Nothing is held back behind a plan.',
    },
    {
      q: 'Will there be a watermark on my file?',
      a: 'No. What you download is the file you asked for, and nothing else.',
    },
    {
      q: 'Which tools work right now?',
      a: `${available.length} of ${tools.length}: ${available.map((tool) => tool.name).join(', ')}. The rest are marked "Soon" — we would rather show you what is coming than pretend it is ready.`,
    },
    {
      q: 'How big a file can I use?',
      a: 'It depends on the tool — between 25 MB and 200 MB. Each one shows its own limit before you pick a file, so you never find out the hard way.',
    },
    {
      q: 'Do I need to install anything?',
      a: 'No. It runs in the browser you are reading this in, on a laptop, a phone or a tablet.',
    },
  ];

  return (
    <section className="border-line border-b">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl text-balance sm:text-4xl">Questions worth asking</h2>

        <div className="mt-10">
          {questions.map((item, index) => (
            <Accordion key={item.q} title={item.q} defaultOpen={index === 0}>
              {item.a}
            </Accordion>
          ))}
        </div>
      </div>
    </section>
  );
}
