import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: 'Are my uploaded documents kept private?',
    answer:
      'Yes. Files are handled in isolated temporary job directories and are never stored permanently or shared with third parties.',
  },
  {
    question: 'Which file formats does DocConvertor support?',
    answer:
      'DocConvertor focuses on four core workflows: PDF to Word (.pdf), Word to PDF (.doc, .docx), Compress PDF (.pdf), and Compress Image (.jpg, .jpeg, .png, .webp).',
  },
  {
    question: 'Do I need to create an account to use the tools?',
    answer:
      'No account or sign-in is required. You can open any tool directly, upload your file, and download the result.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer:
      'Yes. The Compress Image tool supports batch selection and drag-and-drop for multiple JPG, PNG, and WebP images with a customizable quality slider.',
  },
];

interface FAQSectionProps {
  items?: FAQItem[];
  title?: string;
}

export function FAQSection({
  items = DEFAULT_FAQS,
  title = 'Frequently Asked Questions',
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="faq-heading"
    >
      <div className="text-center">
        <h2
          id="faq-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Quick answers about supported formats, privacy, and how DocConvertor works.
        </p>
      </div>

      <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 sm:text-base"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm leading-relaxed text-slate-600">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
