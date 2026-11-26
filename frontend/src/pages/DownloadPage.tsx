import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from 'lucide-react';
import { useBatchResult } from '../context/BatchResultContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { runRealCompressPdfBatch } from '../services/compressPdfService';
import { runBrowserImageBatch } from '../services/imageCompressionService';
import { runRealPdfToWordBatch } from '../services/pdfToWordService';
import { runRealWordToPdfBatch } from '../services/wordToPdfService';
import type { BatchFileItem, ToolId } from '../types/tool';
import { formatFileSize } from '../utils/formatters';
import { hasConfiguredAdSlot } from '../utils/adsConfig';
import { getToolById } from '../utils/toolsConfig';
import { downloadBatchAsZip, downloadBlob } from '../utils/zipBuilder';
import { AdSlot } from '../components/ads/AdSlot';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { DocumentPreview } from '../components/preview/DocumentPreview';
import { ErrorMessage } from '../components/tool/ErrorMessage';

interface DownloadPageProps {
  toolId: ToolId;
}

export function DownloadPage({ toolId }: DownloadPageProps) {
  const tool = getToolById(toolId);
  useDocumentMeta({
    title: `${tool.title} Results — DocConvertor`,
    description: `Download your processed ${tool.title} files on DocConvertor.`,
    noIndex: true,
  });

  const navigate = useNavigate();
  const { session, updateSessionItems, clearSession } = useBatchResult();

  const [isRetrying, setIsRetrying] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);

  const isSessionValid = session !== null && session.toolId === toolId;
  const items = isSessionValid ? session.items : [];

  const completedItems = useMemo(
    () => items.filter((i) => i.status === 'completed' && i.result?.blob),
    [items],
  );
  const failedItems = useMemo(
    () => items.filter((i) => i.status === 'failed'),
    [items],
  );

  const isCompressionTool =
    tool.id === 'compress-pdf' || tool.id === 'compress-image';

  // Expired / Refreshed session recovery UI
  if (!isSessionValid || items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Results session expired
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
            Processed files are kept only in your active browser session and are
            cleared on page refresh for privacy. Upload your files again to
            process a new batch.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={tool.route}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700"
            >
              <Upload className="h-4 w-4" />
              <span>Return to {tool.title}</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Tools</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleRetryFailed() {
    if (isRetrying || !session || failedItems.length === 0) return;

    setErrorBanner(null);
    setNoticeBanner(null);
    setIsRetrying(true);

    const nextItems = session.items.map((item) =>
      item.status === 'failed'
        ? { ...item, status: 'waiting' as const, progress: 0, error: undefined }
        : item,
    );
    updateSessionItems(() => nextItems);

    const controller = new AbortController();
    abortRef.current = controller;

    const onItemUpdate = (
      id: string,
      patch: Partial<
        Pick<BatchFileItem, 'status' | 'progress' | 'error' | 'result'>
      >,
    ) => {
      updateSessionItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    };

    try {
      if (tool.id === 'pdf-to-word') {
        await runRealPdfToWordBatch({
          items: nextItems,
          signal: controller.signal,
          onItemUpdate,
        });
      } else if (tool.id === 'word-to-pdf') {
        await runRealWordToPdfBatch({
          items: nextItems,
          signal: controller.signal,
          onItemUpdate,
        });
      } else if (tool.id === 'compress-pdf') {
        await runRealCompressPdfBatch({
          items: nextItems,
          level: session.pdfLevel,
          signal: controller.signal,
          onItemUpdate,
        });
      } else {
        await runBrowserImageBatch({
          items: nextItems,
          quality: session.imageQuality,
          signal: controller.signal,
          onItemUpdate,
        });
      }
    } finally {
      setIsRetrying(false);
    }
  }

  async function handleDownloadAllZip() {
    if (completedItems.length === 0) {
      setErrorBanner('No successful files available to package into a ZIP.');
      return;
    }
    try {
      const zipName = `docconvertor-${tool.id}.zip`;
      const summary = await downloadBatchAsZip(completedItems, zipName);
      setNoticeBanner(
        `Downloaded "${zipName}" with ${summary.fileCount} file(s): ${summary.archivedNames.join(', ')}.`,
      );
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to create ZIP archive.',
      );
    }
  }

  function handleConvertMore() {
    clearSession();
    navigate(tool.route);
  }

  function handleBackToTools() {
    clearSession();
    navigate('/');
  }

  const allFailed = completedItems.length === 0 && failedItems.length > 0;
  const showSidebarAd = hasConfiguredAdSlot('download-sidebar');

  return (
    <div
      className={`mx-auto px-4 py-8 sm:px-6 lg:px-8 ${
        showSidebarAd ? 'max-w-6xl' : 'max-w-4xl'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumb
          items={[{ label: tool.title, to: tool.route }, { label: 'Results' }]}
        />
        <button
          type="button"
          onClick={handleBackToTools}
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Tools</span>
        </button>
      </div>

      <div
        className={
          showSidebarAd
            ? 'grid grid-cols-1 items-start gap-8 lg:grid-cols-12'
            : ''
        }
      >
        <div className={showSidebarAd ? 'lg:col-span-8' : ''}>
          {/* Results Hero Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            allFailed
              ? 'bg-rose-50 text-rose-600'
              : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {allFailed ? (
            <XCircle className="h-8 w-8" />
          ) : (
            <CheckCircle2 className="h-8 w-8" />
          )}
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {allFailed
            ? 'Processing failed for all files'
            : completedItems.length === 1
              ? 'Your file is ready'
              : 'Your files are ready'}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          <strong className="text-emerald-700">
            {completedItems.length} succeeded
          </strong>
          {failedItems.length > 0 && (
            <>
              {' '}
              &bull;{' '}
              <strong className="text-rose-600">
                {failedItems.length} failed
              </strong>
            </>
          )}
        </p>

        {/* Primary Download / Recovery CTAs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {completedItems.length === 1 && completedItems[0].result?.blob && (
            <button
              type="button"
              onClick={() =>
                downloadBlob(
                  completedItems[0].result!.blob!,
                  completedItems[0].result!.outputFileName,
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700"
            >
              <Download className="h-4 w-4" />
              <span>
                Download{' '}
                {completedItems[0].result.outputExtension
                  .replace('.', '')
                  .toUpperCase()}
              </span>
            </button>
          )}

          {completedItems.length > 1 && (
            <button
              type="button"
              onClick={() => void handleDownloadAllZip()}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700"
            >
              <Archive className="h-4 w-4" />
              <span>Download All as ZIP</span>
            </button>
          )}

          {failedItems.length > 0 && (
            <button
              type="button"
              disabled={isRetrying}
              onClick={() => void handleRetryFailed()}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              <span>{isRetrying ? 'Retrying...' : 'Retry Failed'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleConvertMore}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            <span>Convert More Files</span>
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="mt-5">
          <ErrorMessage
            message={errorBanner}
            onDismiss={() => setErrorBanner(null)}
          />
        </div>
      )}

      {noticeBanner && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{noticeBanner}</span>
        </div>
      )}

      {/* Results File List */}
      <div className="mt-6 space-y-3">
        {items.map((item) => {
          const isOk = item.status === 'completed' && item.result?.blob;
          const outExt = item.result?.outputExtension
            .replace('.', '')
            .toUpperCase();

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    isOk
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {isOk ? item.result!.outputFileName : item.file.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {outExt && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                        {outExt}
                      </span>
                    )}
                    {isOk && item.result ? (
                      isCompressionTool ? (
                        item.result.isLargerThanOriginal ? (
                          <span className="font-medium text-amber-700">
                            {formatFileSize(item.result.originalSize)} &mdash;
                            original preserved (0% saved)
                          </span>
                        ) : (
                          <span>
                            {formatFileSize(item.result.originalSize)} &rarr;{' '}
                            <strong className="text-emerald-700">
                              {formatFileSize(item.result.compressedSize)}
                            </strong>{' '}
                            <strong className="text-emerald-700">
                              (-{item.result.savedPercent}%)
                            </strong>
                          </span>
                        )
                      ) : (
                        <span>{formatFileSize(item.result.compressedSize)}</span>
                      )
                    ) : (
                      <span className="text-rose-600">
                        {item.error ?? 'Processing failed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isOk && item.result?.blob ? (
                  <>
                    {tool.id === 'compress-image' && (
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewId(item.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Compare
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(
                          item.result!.blob!,
                          item.result!.outputFileName,
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </>
                ) : (
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                    Failed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Comparison preserved on Download Page for Compress Image */}
      {tool.id === 'compress-image' && completedItems.length > 0 && (
        <div className="mt-6">
          <DocumentPreview
            toolId="compress-image"
            items={completedItems}
            selectedId={selectedPreviewId ?? completedItems[0].id}
            onSelect={setSelectedPreviewId}
          />
        </div>
      )}
        </div>

        {showSidebarAd && (
          <div className="lg:col-span-4">
            <AdSlot
              placement="download-sidebar"
              variant="sidebar"
              allowPreview={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
