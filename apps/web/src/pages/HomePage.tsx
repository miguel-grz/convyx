import { usePageMeta } from '@/hooks/usePageMeta';
import { Hero } from '@/components/marketing/Hero';
import { KeyFeatures } from '@/components/marketing/KeyFeatures';
import { StartHere } from '@/components/marketing/StartHere';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { PrivacyStrip } from '@/components/marketing/PrivacyStrip';
import { Faq } from '@/components/marketing/Faq';

/**
 * The landing page explains the product; /tools is where the catalogue lives.
 *
 * Order matters: the way to a tool comes before the argument for using them.
 * Someone who already knows what they need should not have to scroll past five
 * reasons to trust us, and someone who does not will read them either way.
 *
 * It deliberately holds no full tool grid. The catalogue grew and pushed
 * everything that explains Convyx below the fold, so the way in from here is
 * the hero's search and a bounded "Start here" selection.
 */
export function HomePage() {
  usePageMeta({
    title: 'Convyx — free PDF and image tools that respect your privacy',
    description:
      'Merge, split, convert and compress PDFs and images. Most tools run entirely in your browser, so your files are never uploaded. No account, no watermarks.',
  });

  return (
    <>
      <Hero />
      <StartHere />
      <KeyFeatures />
      <HowItWorks />
      <PrivacyStrip />
      <Faq />
    </>
  );
}
