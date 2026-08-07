import { tools } from '@/tools/registry';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Hero } from '@/components/marketing/Hero';
import { KeyFeatures } from '@/components/marketing/KeyFeatures';
import { TryItNow } from '@/components/marketing/TryItNow';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { PrivacyStrip } from '@/components/marketing/PrivacyStrip';
import { Faq } from '@/components/marketing/Faq';

/**
 * The landing page explains the product; /tools is where the catalogue lives.
 *
 * It deliberately holds no tool grid. The grid grew with the catalogue and
 * pushed everything that explains Convyx below the fold, so the way in from
 * here is the hero's search, the quick picks, and the header's category menus.
 */
export function HomePage() {
  // Working tools lead: a first row of dead ends would be honest and useless.
  const quickPicks = tools
    .filter((tool) => tool.featured)
    .sort((a, b) => Number(b.status === 'available') - Number(a.status === 'available'))
    .slice(0, 4);

  usePageMeta({
    title: 'Convyx — free PDF and image tools that respect your privacy',
    description:
      'Merge, split, convert and compress PDFs and images. Most tools run entirely in your browser, so your files are never uploaded. No account, no watermarks.',
  });

  return (
    <>
      <Hero quickPicks={quickPicks} />
      <KeyFeatures />
      <TryItNow />
      <HowItWorks />
      <PrivacyStrip />
      <Faq />
    </>
  );
}
