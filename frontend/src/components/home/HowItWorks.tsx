import { Download, SlidersHorizontal, UploadCloud } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: 'Upload',
    description:
      'Drag and drop your PDF, Word document, or images directly into the workspace.',
    icon: UploadCloud,
  },
  {
    number: '02',
    title: 'Process',
    description:
      'Select your preferred compression level or conversion target and start processing.',
    icon: SlidersHorizontal,
  },
  {
    number: '03',
    title: 'Download',
    description:
      'Save your converted or optimized file immediately with zero account setup.',
    icon: Download,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-slate-200 bg-white py-16"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            How It Works
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Three straightforward steps from upload to download.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-slate-400">
                    STEP {step.number}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
