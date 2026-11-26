import { AdSlot } from '../components/ads/AdSlot';
import { FAQSection } from '../components/common/FAQSection';
import { Hero } from '../components/home/Hero';
import { HowItWorks } from '../components/home/HowItWorks';
import { PrivacySection } from '../components/home/PrivacySection';
import { ToolGrid } from '../components/home/ToolGrid';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function HomePage() {
  useDocumentMeta({
    title: 'DocConvertor — Your Documents. Simplified.',
    description:
      'Convert PDF to Word, Word to PDF, compress PDFs, and optimize images online with fast, private batch tools.',
  });

  return (
    <>
      <Hero />
      <ToolGrid />
      <HowItWorks />
      <AdSlot placement="home-mid" className="pt-8" />
      <PrivacySection />
      <AdSlot placement="home-lower" className="pb-4" />
      <FAQSection />
    </>
  );
}
