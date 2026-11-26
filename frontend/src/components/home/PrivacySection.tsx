import { Clock, Lock, ShieldCheck } from 'lucide-react';

const GUARANTEES = [
  {
    title: 'Isolated Processing',
    description:
      'Every job runs in its own temporary workspace without touching other files.',
    icon: Lock,
  },
  {
    title: 'Automatic Cleanup',
    description:
      'Temporary files are automatically purged after the retention window expires.',
    icon: Clock,
  },
  {
    title: 'No Account Required',
    description:
      'Use all four utilities immediately with no sign-up walls or tracking clutter.',
    icon: ShieldCheck,
  },
];

export function PrivacySection() {
  return (
    <section
      id="about"
      className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="privacy-heading"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="max-w-2xl">
          <h2
            id="privacy-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Built for Privacy &amp; Reliability
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-base">
            DocConvertor is engineered to handle everyday documents cleanly,
            keeping your workflow fast and your files private.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {GUARANTEES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
