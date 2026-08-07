import { tools } from '@/tools/registry';
import { Accordion } from '@/components/ui/accordion';

/**
 * The questions someone actually asks before dropping a private document into a
 * website they found five seconds ago. Answers are specific, including the
 * uncomfortable one about how much of the catalog is finished.
 */
export function Faq() {
  const local = tools.filter((tool) => tool.processing === 'client').length;
  const available = tools.filter((tool) => tool.status === 'available');

  const questions = [
    {
      q: 'Do you upload my files?',
      a: `Not for ${local} of our ${tools.length} tools. Those run entirely in your browser — you can watch the network tab stay empty while a merge completes. The remaining tools need software a browser cannot run, so for those the file is sent over HTTPS and deleted within an hour.`,
    },
    {
      q: 'How long do you keep the files that do get uploaded?',
      a: 'One hour at the outside, and usually only until you download the result. Deletion runs on a schedule rather than depending on anyone remembering to trigger it.',
    },
    {
      q: 'Do I need an account?',
      a: 'No. There is no sign-up, no email, and nothing in the catalog is held back behind a plan.',
    },
    {
      q: 'Will the output have a watermark?',
      a: 'No. What you download is the file you asked for.',
    },
    {
      q: 'How many tools actually work today?',
      a: `${available.length} of ${tools.length}: ${available.map((tool) => tool.name).join(', ')}. The rest are listed with a “Soon” badge because we would rather show the roadmap than pretend the catalog is finished.`,
    },
    {
      q: 'Is there a file size limit?',
      a: 'Yes, and it differs per tool — between 25 MB and 200 MB. Every tool shows its own limit before you pick a file, not after the upload fails.',
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
