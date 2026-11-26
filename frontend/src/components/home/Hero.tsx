import { ArrowDown } from 'lucide-react';

export function Hero() {
  function scrollToTools() {
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="bg-white border-b border-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Your Documents. <span className="text-rose-600">Simplified.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Convert documents and compress files effortlessly with simple, fast and
          reliable online tools.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <button
            type="button"
            onClick={scrollToTools}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 sm:text-base"
          >
            <span>Explore Tools</span>
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
