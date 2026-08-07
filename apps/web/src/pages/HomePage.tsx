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
 * It deliberately holds no full tool grid. The catalogue grew and pushed
 * everything that explains Convyx below the fold, so the way in from here is
 * the hero's search, a short "Start here" selection, and the header's menus.
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
      <KeyFeatures />
      <StartHere />
      <HowItWorks />
      <PrivacyStrip />
      <Faq />
    </>
  );
}
