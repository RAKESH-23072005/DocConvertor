import type { ToolId } from '../../types/tool';
import { TOOL_GUIDES } from '../../utils/toolGuides';

interface ToolGuideSectionProps {
  toolId: ToolId;
}

export function ToolGuideSection({ toolId }: ToolGuideSectionProps) {
  const guide = TOOL_GUIDES[toolId];

  return (
    <section
      className="mx-auto mt-14 max-w-4xl space-y-8 border-t border-slate-200 pt-10"
      aria-label="Tool Instructions and FAQ"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900">How to use this tool</h2>
        <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {guide.steps.map((step, index) => (
            <li
              key={step}
              className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600 shadow-xs"
            >
              <span className="mb-1.5 inline-block text-[11px] font-bold uppercase tracking-wider text-rose-600">
                Step {index + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Frequently Asked Questions
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guide.faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {faq.question}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
