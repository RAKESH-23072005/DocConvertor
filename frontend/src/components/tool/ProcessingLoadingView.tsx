import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { BatchFileItem, ToolDefinition, ToolId } from '../../types/tool';
import { formatFileSize } from '../../utils/formatters';

interface ProcessingLoadingViewProps {
  tool: ToolDefinition;
  items: BatchFileItem[];
  overallProgress: number;
  completedCount: number;
  failedCount: number;
  onCancel: () => void;
}

const PROCESSING_HEADINGS: Record<ToolId, string> = {
  'pdf-to-word': 'Converting PDF to Word...',
  'word-to-pdf': 'Converting Word to PDF...',
  'compress-pdf': 'Compressing PDF...',
  'compress-image': 'Compressing Images...',
};

export function ProcessingLoadingView({
  tool,
  items,
  overallProgress,
  completedCount,
  failedCount,
  onCancel,
}: ProcessingLoadingViewProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const finishedCount = completedCount + failedCount;
  const activeCount = items.filter((item) => item.status === 'processing').length;
  const isServerTool = tool.id !== 'compress-image';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Centered animated loader */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            {PROCESSING_HEADINGS[tool.id]}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {finishedCount} of {items.length} file
            {items.length === 1 ? '' : 's'} processed
            {activeCount > 0 ? ` • ${activeCount} in progress` : ''}
          </p>
        </div>

        {/* Overall progress bar */}
        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Overall Progress</span>
            <span className="tabular-nums text-rose-600">
              {overallProgress}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-rose-600 transition-all duration-300 ease-out"
              style={{ width: `${Math.max(4, overallProgress)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Elapsed: {elapsedSeconds}s</span>
            <span>Please keep this tab open</span>
          </div>
        </div>

        {/* Helpful cold-start / long-job notice */}
        {isServerTool && elapsedSeconds >= 5 && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Processing on the server can take 30–60 seconds if the free
              backend instance is waking up from sleep. Your files will appear
              on the download page automatically once finished.
            </span>
          </div>
        )}

        {/* Per-file status list */}
        <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/50">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {item.file.name}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>{formatFileSize(item.file.size)}</span>
                  <span>•</span>
                  <span className="capitalize">{item.status}</span>
                </div>
                {item.status === 'processing' && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-rose-600 transition-all duration-300"
                      style={{ width: `${Math.max(8, item.progress)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="shrink-0">
                {item.status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                {item.status === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                )}
                {item.status === 'processing' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-rose-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {item.progress}%
                  </span>
                )}
                {item.status === 'waiting' && (
                  <Clock className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions & privacy note */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>
              {isServerTool
                ? 'Temporary files are deleted automatically after processing.'
                : 'Processed locally in your browser.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
