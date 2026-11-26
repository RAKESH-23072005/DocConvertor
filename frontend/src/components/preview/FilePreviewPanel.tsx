import { Eye } from 'lucide-react';
import type { BatchFileItem } from '../../types/tool';
import { formatFileSize } from '../../utils/formatters';

interface FilePreviewPanelProps {
  items: BatchFileItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  pageCount?: number | null;
  children: React.ReactNode;
}

export function FilePreviewPanel({
  items,
  selectedId,
  onSelect,
  pageCount,
  children,
}: FilePreviewPanelProps) {
  const activeItem = items.find((it) => it.id === selectedId) ?? items[0];
  if (!activeItem) return null;

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label="Document Preview Panel"
    >
      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Eye className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-slate-900">
              Preview: {activeItem.file.name}
            </h2>
            <p className="text-xs text-slate-500">
              {formatFileSize(activeItem.file.size)}
              {pageCount ? ` • ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}` : ''}
            </p>
          </div>
        </div>

        {items.length > 1 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="preview-file-selector"
              className="text-xs font-medium text-slate-500"
            >
              Inspect file:
            </label>
            <select
              id="preview-file-selector"
              value={activeItem.id}
              onChange={(e) => onSelect(e.target.value)}
              className="max-w-56 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              {items.map((it, index) => (
                <option key={it.id} value={it.id}>
                  #{index + 1} {it.file.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {children}
    </section>
  );
}
