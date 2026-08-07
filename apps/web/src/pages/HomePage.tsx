import { useState } from 'react';
import type { ToolCategory } from '@convyx/tool-contract';
import { tools } from '@/tools/registry';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Hero } from '@/components/marketing/Hero';
import { ToolFinder } from '@/components/marketing/ToolFinder';
import { TryItNow } from '@/components/marketing/TryItNow';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { PrivacyStrip } from '@/components/marketing/PrivacyStrip';
import { Faq } from '@/components/marketing/Faq';

/**
 * The hero's search box and the grid below share one query, so typing at the top
 * filters the catalog in place instead of navigating somewhere else.
 */
export function HomePage() {
  // Working tools lead: a first row of dead ends would be honest and useless.
  const quickPicks = tools
    .filter((tool) => tool.featured)
    .sort((a, b) => Number(b.status === 'available') - Number(a.status === 'available'))
    .slice(0, 4);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory | null>(null);

  usePageMeta({
    title: 'Convyx — free PDF and image tools that respect your privacy',
    description:
      'Merge, split, convert and compress PDFs and images. Most tools run entirely in your browser, so your files are never uploaded. No account, no watermarks.',
  });

  return (
    <>
      <Hero query={query} onQueryChange={setQuery} quickPicks={quickPicks} />

      <section id="tools" className="border-line border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="sr-only">All tools</h2>
          <ToolFinder
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
            showSearch={false}
          />
        </div>
      </section>

      <TryItNow />
      <HowItWorks />
      <PrivacyStrip />
      <Faq />
    </>
  );
}
