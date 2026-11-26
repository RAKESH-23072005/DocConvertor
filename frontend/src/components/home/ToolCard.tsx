import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileDown,
  FileText,
  FileType2,
  ImageDown,
} from 'lucide-react';
import type { ToolDefinition, ToolId } from '../../types/tool';

interface ToolCardProps {
  tool: ToolDefinition;
}

const ACCENT_STYLES: Record<
  ToolDefinition['accentColor'],
  { iconBg: string; hoverBorder: string; actionBtn: string }
> = {
  rose: {
    iconBg: 'bg-rose-50 text-rose-600',
    hoverBorder: 'hover:border-rose-300',
    actionBtn: 'text-rose-600 group-hover:text-rose-700',
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-600',
    hoverBorder: 'hover:border-blue-300',
    actionBtn: 'text-blue-600 group-hover:text-blue-700',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    hoverBorder: 'hover:border-emerald-300',
    actionBtn: 'text-emerald-600 group-hover:text-emerald-700',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    hoverBorder: 'hover:border-amber-300',
    actionBtn: 'text-amber-600 group-hover:text-amber-700',
  },
};

function ToolIcon({ id }: { id: ToolId }) {
  switch (id) {
    case 'pdf-to-word':
      return <FileText className="h-6 w-6" />;
    case 'word-to-pdf':
      return <FileType2 className="h-6 w-6" />;
    case 'compress-pdf':
      return <FileDown className="h-6 w-6" />;
    case 'compress-image':
      return <ImageDown className="h-6 w-6" />;
  }
}

export function ToolCard({ tool }: ToolCardProps) {
  const styles = ACCENT_STYLES[tool.accentColor];

  return (
    <Link
      to={tool.route}
      className={`group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles.hoverBorder}`}
    >
      <div>
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconBg}`}
        >
          <ToolIcon id={tool.id} />
        </div>
        <h3 className="mt-5 text-lg font-bold text-slate-900">{tool.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {tool.description}
        </p>
      </div>

      <div className="mt-6">
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${styles.actionBtn}`}
        >
          <span>{tool.ctaLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
