import { TOOLS } from '../../utils/toolsConfig';
import { ToolCard } from './ToolCard';

export function ToolGrid() {
  return (
    <section
      id="tools"
      className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="tools-heading"
    >
      <div className="mb-8 text-center">
        <h2
          id="tools-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          Choose a Tool
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Four focused utilities designed for everyday document and image tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
