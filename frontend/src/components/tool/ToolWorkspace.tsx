import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  FileDown,
  FileText,
  FileType2,
  ImageDown,
  Info,
  Loader2,
} from 'lucide-react';
import {
  revokeBatchItemUrls,
  useBatchResult,
} from '../../context/BatchResultContext';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { runRealCompressPdfBatch } from '../../services/compressPdfService';
import { runBrowserImageBatch } from '../../services/imageCompressionService';
import { runRealPdfToWordBatch } from '../../services/pdfToWordService';
import { runRealWordToPdfBatch } from '../../services/wordToPdfService';
import type {
  BatchFileItem,
  PdfCompressionLevel,
  ToolDefinition,
  ToolId,
} from '../../types/tool';
import { validateFileForTool } from '../../utils/fileValidation';
import { getRelatedTools } from '../../utils/toolsConfig';
import { downloadBatchAsZip, downloadBlob } from '../../utils/zipBuilder';
import { Breadcrumb } from '../common/Breadcrumb';
import { AdSlot } from '../ads/AdSlot';
import { DocumentPreview } from '../preview/DocumentPreview';
import { BatchFileQueue } from './BatchFileQueue';
import { CompressionSettings } from './CompressionSettings';
import { ErrorMessage } from './ErrorMessage';
import { FileUpload } from './FileUpload';
import { ToolGuideSection } from './ToolGuideSection';

interface ToolWorkspaceProps {
  tool: ToolDefinition;
}

const TOOL_ICON_STYLES: Record<ToolDefinition['accentColor'], string> = {
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

function ToolHeaderIcon({ id }: { id: ToolId }) {
  switch (id) {
    case 'pdf-to-word':
      return <FileText className="h-7 w-7" />;
    case 'word-to-pdf':
      return <FileType2 className="h-7 w-7" />;
    case 'compress-pdf':
      return <FileDown className="h-7 w-7" />;
    case 'compress-image':
      return <ImageDown className="h-7 w-7" />;
  }
}

export function ToolWorkspace({ tool }: ToolWorkspaceProps) {
  useDocumentMeta({
    title: `${tool.title} — DocConvertor`,
    description: tool.description,
  });

  const navigate = useNavigate();
  const { setSession } = useBatchResult();
  const [items, setItems] = useState<BatchFileItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [pdfLevel, setPdfLevel] = useState<PdfCompressionLevel>('recommended');
  const [imageQuality, setImageQuality] = useState<number>(75);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const itemsRef = useRef<BatchFileItem[]>([]);
  const handedOffRef = useRef<boolean>(false);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (!handedOffRef.current) {
        itemsRef.current.forEach(revokeBatchItemUrls);
      }
    };
  }, []);

  const completedCount = useMemo(
    () => items.filter((item) => item.status === 'completed').length,
    [items],
  );
  const failedCount = useMemo(
    () => items.filter((item) => item.status === 'failed').length,
    [items],
  );
  const waitingCount = useMemo(
    () => items.filter((item) => item.status === 'waiting').length,
    [items],
  );

  const overallProgress = useMemo(() => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => {
      if (item.status === 'completed' || item.status === 'failed') {
        return sum + 100;
      }
      return sum + item.progress;
    }, 0);
    return Math.round(total / items.length);
  }, [items]);

  async function handleFilesSelected(incoming: File[]) {
    if (isBatchRunning) return;

    setErrorMessage(null);
    setDownloadNotice(null);

    const validItems: BatchFileItem[] = [];
    const validationErrors: string[] = [];

    for (const file of incoming) {
      const error = await validateFileForTool(file, tool);
      if (error) {
        validationErrors.push(error);
        continue;
      }

      const shouldCreateImagePreview = tool.id === 'compress-image';
      validItems.push({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: shouldCreateImagePreview
          ? URL.createObjectURL(file)
          : undefined,
        status: 'waiting',
        progress: 0,
      });
    }

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(' '));
    }

    if (validItems.length > 0) {
      setItems((prev) => {
        const next = [...prev, ...validItems];
        if (!selectedPreviewId || !next.some((i) => i.id === selectedPreviewId)) {
          setSelectedPreviewId(next[0].id);
        }
        return next;
      });
    }
  }

  function handleRemoveItem(id: string) {
    if (isBatchRunning) return;
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) revokeBatchItemUrls(target);
      const next = prev.filter((item) => item.id !== id);
      if (selectedPreviewId === id) {
        setSelectedPreviewId(next[0]?.id ?? null);
      }
      return next;
    });
  }

  function handleClearCompleted() {
    if (isBatchRunning) return;
    setItems((prev) => {
      prev
        .filter((item) => item.status === 'completed')
        .forEach(revokeBatchItemUrls);
      const next = prev.filter((item) => item.status !== 'completed');
      if (!next.some((i) => i.id === selectedPreviewId)) {
        setSelectedPreviewId(next[0]?.id ?? null);
      }
      return next;
    });
    setDownloadNotice(null);
  }

  function handleClearAll() {
    if (isBatchRunning) return;
    items.forEach(revokeBatchItemUrls);
    setItems([]);
    setSelectedPreviewId(null);
    setErrorMessage(null);
    setDownloadNotice(null);
  }

  async function executeBatch(targetItems: BatchFileItem[]) {
    const waiting = targetItems.filter((item) => item.status === 'waiting');
    if (isBatchRunning || waiting.length === 0) return;

    setErrorMessage(null);
    setDownloadNotice(null);
    setIsBatchRunning(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let latestItems = targetItems;
    const onItemUpdate = (
      id: string,
      patch: Partial<
        Pick<BatchFileItem, 'status' | 'progress' | 'error' | 'result'>
      >,
    ) => {
      latestItems = latestItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );
      setItems(latestItems);
    };

    try {
      if (tool.id === 'pdf-to-word') {
        await runRealPdfToWordBatch({
          items: targetItems,
          signal: controller.signal,
          onItemUpdate,
        });
      } else if (tool.id === 'word-to-pdf') {
        await runRealWordToPdfBatch({
          items: targetItems,
          signal: controller.signal,
          onItemUpdate,
        });
      } else if (tool.id === 'compress-pdf') {
        await runRealCompressPdfBatch({
          items: targetItems,
          level: pdfLevel,
          signal: controller.signal,
          onItemUpdate,
        });
      } else {
        await runBrowserImageBatch({
          items: targetItems,
          quality: imageQuality,
          signal: controller.signal,
          onItemUpdate,
        });
      }

      if (!controller.signal.aborted) {
        handedOffRef.current = true;
        setSession({
          toolId: tool.id,
          items: latestItems,
          pdfLevel,
          imageQuality,
          createdAt: Date.now(),
        });
        navigate(`${tool.route}/download`);
      }
    } finally {
      setIsBatchRunning(false);
    }
  }

  function handleRetryItem(id: string) {
    if (isBatchRunning) return;
    const nextItems = items.map((item) =>
      item.id === id
        ? { ...item, status: 'waiting' as const, progress: 0, error: undefined }
        : item,
    );
    setItems(nextItems);
    void executeBatch(nextItems);
  }

  function handleRetryFailed() {
    if (isBatchRunning) return;
    const nextItems = items.map((item) =>
      item.status === 'failed'
        ? { ...item, status: 'waiting' as const, progress: 0, error: undefined }
        : item,
    );
    setItems(nextItems);
    void executeBatch(nextItems);
  }

  function handleDownloadItem(item: BatchFileItem) {
    if (!item.result?.blob) return;
    downloadBlob(item.result.blob, item.result.outputFileName);
  }

  async function handleDownloadAllZip() {
    const completed = items.filter(
      (item) => item.status === 'completed' && item.result?.blob,
    );
    if (completed.length === 0) {
      setErrorMessage(
        'No files succeeded in this batch. Fix or retry failed files before downloading a ZIP.',
      );
      return;
    }

    try {
      const zipName = `docconvertor-${tool.id}.zip`;
      const summary = await downloadBatchAsZip(completed, zipName);
      setDownloadNotice(
        `Downloaded "${zipName}" containing ${summary.fileCount} file(s): ${summary.archivedNames.join(', ')}.`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate ZIP archive.';
      setErrorMessage(message);
    }
  }

  const hasSettings =
    tool.id === 'compress-pdf' || tool.id === 'compress-image';
  const relatedTools = getRelatedTools(tool.id);

  const actionCard = (
    <div className="sticky bottom-3 z-30 space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-md backdrop-blur-sm sm:p-5 lg:static lg:shadow-sm">
      <button
        type="button"
        disabled={isBatchRunning || waitingCount === 0}
        onClick={() => void executeBatch(items)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isBatchRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing Batch...</span>
          </>
        ) : (
          <>
            <span>{tool.actionLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-slate-500">
        {tool.id === 'pdf-to-word' &&
          'Converts up to 2 PDFs simultaneously via FastAPI + pdf2docx.'}
        {tool.id === 'word-to-pdf' &&
          'Converts up to 2 Word documents simultaneously via LibreOffice.'}
        {tool.id === 'compress-pdf' &&
          'Compresses up to 2 PDFs simultaneously via Ghostscript & pikepdf.'}
        {tool.id === 'compress-image' &&
          'Processes up to 2 images locally in your browser. Images never leave your device.'}
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top workspace bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumb items={[{ label: tool.title }]} />
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Tools</span>
        </Link>
      </div>

      {/* Centered tool introduction */}
      <div className="mx-auto max-w-2xl text-center">
        <div
          className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${TOOL_ICON_STYLES[tool.accentColor]}`}
        >
          <ToolHeaderIcon id={tool.id} />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {tool.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          {tool.description}
        </p>
      </div>

      {errorMessage && (
        <div className="mx-auto mt-6 max-w-4xl">
          <ErrorMessage
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        </div>
      )}

      {!isBatchRunning &&
        items.length > 0 &&
        completedCount === 0 &&
        failedCount === items.length && (
          <div className="mx-auto mt-6 max-w-4xl">
            <ErrorMessage message="All files in this batch failed. Review the per-file errors below and click Retry Failed to try again." />
          </div>
        )}

      {downloadNotice && (
        <div className="mx-auto mt-6 flex max-w-4xl items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{downloadNotice}</span>
        </div>
      )}

      <div className="mt-8">
        {items.length === 0 ? (
          <div className="mx-auto max-w-3xl space-y-4">
            <FileUpload tool={tool} onFilesSelected={handleFilesSelected} />
            {tool.layoutNote && (
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{tool.layoutNote}</span>
              </div>
            )}
          </div>
        ) : hasSettings ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <BatchFileQueue
                tool={tool}
                items={items}
                selectedPreviewId={selectedPreviewId}
                isBatchRunning={isBatchRunning}
                overallProgress={overallProgress}
                completedCount={completedCount}
                failedCount={failedCount}
                onSelectPreview={setSelectedPreviewId}
                onAddFiles={handleFilesSelected}
                onRemoveItem={handleRemoveItem}
                onRetryItem={handleRetryItem}
                onRetryFailed={handleRetryFailed}
                onClearCompleted={handleClearCompleted}
                onClearAll={handleClearAll}
                onDownloadItem={handleDownloadItem}
                onDownloadAllZip={handleDownloadAllZip}
              />

              {tool.id === 'compress-image' && (
                <DocumentPreview
                  toolId={tool.id}
                  items={items}
                  selectedId={selectedPreviewId}
                  onSelect={setSelectedPreviewId}
                />
              )}
            </div>

            <div className="space-y-4">
              <CompressionSettings
                toolId={tool.id}
                pdfLevel={pdfLevel}
                onPdfLevelChange={setPdfLevel}
                imageQuality={imageQuality}
                onImageQualityChange={setImageQuality}
                disabled={isBatchRunning}
              />
              {actionCard}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            <BatchFileQueue
              tool={tool}
              items={items}
              selectedPreviewId={selectedPreviewId}
              isBatchRunning={isBatchRunning}
              overallProgress={overallProgress}
              completedCount={completedCount}
              failedCount={failedCount}
              onSelectPreview={setSelectedPreviewId}
              onAddFiles={handleFilesSelected}
              onRemoveItem={handleRemoveItem}
              onRetryItem={handleRetryItem}
              onRetryFailed={handleRetryFailed}
              onClearCompleted={handleClearCompleted}
              onClearAll={handleClearAll}
              onDownloadItem={handleDownloadItem}
              onDownloadAllZip={handleDownloadAllZip}
            />

            {actionCard}

            {tool.layoutNote && (
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{tool.layoutNote}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ad placement strictly below upload workspace and only when not actively processing */}
      {items.length === 0 && <AdSlot placement="tool-bottom" className="mt-12" />}

      {/* Tool-specific instructions and FAQs */}
      <ToolGuideSection toolId={tool.id} />

      {/* Subtle tool switcher bar */}
      <div className="mt-14 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-8 text-xs text-slate-500">
        <span className="mr-1 font-medium text-slate-600">Switch tool:</span>
        {relatedTools.map((other) => (
          <Link
            key={other.id}
            to={other.route}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            {other.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
