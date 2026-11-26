import { useRef } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { BatchFileItem, ToolDefinition } from '../../types/tool';
import { formatFileSize } from '../../utils/formatters';
import { DownloadButton } from './DownloadButton';
import { FileThumbnail } from './FileThumbnail';

interface BatchFileQueueProps {
  tool: ToolDefinition;
  items: BatchFileItem[];
  selectedPreviewId: string | null;
  isBatchRunning: boolean;
  overallProgress: number;
  completedCount: number;
  failedCount: number;
  onSelectPreview: (id: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onRetryFailed: () => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onDownloadItem: (item: BatchFileItem) => void;
  onDownloadAllZip: () => void;
}

function StatusBadge({ status }: { status: BatchFileItem['status'] }) {
  switch (status) {
    case 'waiting':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          <Clock className="h-3 w-3" />
          Ready
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
  }
}

export function BatchFileQueue({
  tool,
  items,
  selectedPreviewId,
  isBatchRunning,
  overallProgress,
  completedCount,
  failedCount,
  onSelectPreview,
  onAddFiles,
  onRemoveItem,
  onRetryItem,
  onRetryFailed,
  onClearCompleted,
  onClearAll,
  onDownloadItem,
  onDownloadAllZip,
}: BatchFileQueueProps) {
  const addInputRef = useRef<HTMLInputElement>(null);

  function handleAddChange(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      onAddFiles(Array.from(fileList));
    }
    event.target.value = '';
  }

  const isCompressionTool =
    tool.id === 'compress-pdf' || tool.id === 'compress-image';
  const showImagePreviewControls = tool.id === 'compress-image';

  return (
    <div className="space-y-4">
      <input
        ref={addInputRef}
        type="file"
        accept={tool.acceptedMimeTypes}
        multiple
        onChange={handleAddChange}
        className="hidden"
        aria-label="Add more files to queue"
      />

      {/* Batch Summary & Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Batch Queue ({items.length}{' '}
              {items.length === 1 ? 'file' : 'files'})
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span>
                Completed:{' '}
                <strong className="text-emerald-700">{completedCount}</strong>
              </span>
              <span>
                Failed:{' '}
                <strong className="text-rose-600">{failedCount}</strong>
              </span>
              <span>
                Remaining:{' '}
                <strong>{items.length - completedCount - failedCount}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => addInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add More Files</span>
            </button>

            {failedCount > 0 && (
              <button
                type="button"
                disabled={isBatchRunning}
                onClick={onRetryFailed}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry Failed</span>
              </button>
            )}

            {completedCount > 0 && (
              <button
                type="button"
                disabled={isBatchRunning}
                onClick={onClearCompleted}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>Clear Completed</span>
              </button>
            )}

            <button
              type="button"
              disabled={isBatchRunning}
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>

            <button
              type="button"
              disabled={isBatchRunning || completedCount === 0}
              onClick={onDownloadAllZip}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Download All as ZIP</span>
            </button>
          </div>
        </div>

        {(isBatchRunning || completedCount > 0 || failedCount > 0) && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>Overall Batch Progress</span>
              <span className="font-semibold text-slate-700">
                {overallProgress}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-rose-600 transition-all duration-200"
                style={{ width: `${overallProgress}%` }}
                role="progressbar"
                aria-valuenow={overallProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}
      </div>

      {/* Individual File Rows */}
      <div className="space-y-2.5">
        {items.map((item) => {
          const ext = item.file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
          const isSelectedPreview =
            showImagePreviewControls && item.id === selectedPreviewId;

          return (
            <div
              key={item.id}
              className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
                isSelectedPreview
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3.5">
                  <FileThumbnail toolId={tool.id} item={item} />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.file.name}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                        {ext}
                      </span>
                      <span>{formatFileSize(item.file.size)}</span>

                      {isCompressionTool &&
                        item.status === 'completed' &&
                        item.result &&
                        (item.result.isLargerThanOriginal ? (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            No reduction
                            {item.result.attemptedSize
                              ? ` (output ${formatFileSize(item.result.attemptedSize)}, +${item.result.sizeIncreasePercent ?? 0}%)`
                              : ''}{' '}
                            — original preserved
                          </span>
                        ) : (
                          <span className="font-medium text-emerald-700">
                            &rarr; {formatFileSize(item.result.compressedSize)}{' '}
                            (-{item.result.savedPercent}%)
                          </span>
                        ))}
                    </div>

                    {tool.id === 'compress-image' &&
                      item.status === 'completed' &&
                      item.result?.originalDimensions &&
                      item.result?.compressedDimensions && (
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                          {item.previewUrl && item.result.compressedPreviewUrl && (
                            <div className="flex items-center gap-2">
                              <img
                                src={item.result.compressedPreviewUrl}
                                alt={`Compressed ${item.file.name}`}
                                className="h-10 w-10 rounded border border-emerald-200 object-cover"
                              />
                              <span>Compressed preview</span>
                            </div>
                          )}
                          <span>
                            Original: {item.result.originalDimensions.width}&times;
                            {item.result.originalDimensions.height} px
                          </span>
                          <span>
                            Compressed: {item.result.compressedDimensions.width}&times;
                            {item.result.compressedDimensions.height} px
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {showImagePreviewControls && (
                    <button
                      type="button"
                      onClick={() => onSelectPreview(item.id)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        isSelectedPreview
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>
                        {item.status === 'completed' ? 'Compare' : 'Preview'}
                      </span>
                    </button>
                  )}

                  {item.status === 'completed' && item.result && (
                    <DownloadButton
                      label="Download"
                      variant="secondary"
                      size="sm"
                      onClick={() => onDownloadItem(item)}
                    />
                  )}

                  {item.status === 'failed' && !isBatchRunning && (
                    <button
                      type="button"
                      onClick={() => onRetryItem(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry</span>
                    </button>
                  )}

                  {item.status !== 'processing' && !isBatchRunning && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {item.status === 'processing' && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {item.status === 'failed' && item.error && (
                <p className="mt-2.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {item.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
