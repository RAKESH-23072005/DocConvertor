import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { FileText, FileType2, Image as ImageIcon } from 'lucide-react';
import type { BatchFileItem, ToolId } from '../../types/tool';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface FileThumbnailProps {
  toolId: ToolId;
  item: BatchFileItem;
}

function PdfFirstPageThumbnail({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    let active = true;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
    let renderTask: pdfjsLib.RenderTask | null = null;

    async function renderFirstPage() {
      setStatus('loading');
      try {
        const buffer = await file.arrayBuffer();
        if (!active) return;

        loadingTask = pdfjsLib.getDocument({ data: buffer });
        pdfDoc = await loadingTask.promise;
        if (!active || pdfDoc.numPages < 1) {
          if (pdfDoc) void pdfDoc.cleanup();
          return;
        }

        const page = await pdfDoc.getPage(1);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setStatus('error');
          return;
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 80;
        const targetHeight = 100;
        const scale = Math.min(
          targetWidth / baseViewport.width,
          targetHeight / baseViewport.height,
        );
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        });
        await renderTask.promise;

        if (active) {
          setStatus('ready');
        }
      } catch {
        if (active) {
          setStatus('error');
        }
      }
    }

    void renderFirstPage();

    return () => {
      active = false;
      renderTask?.cancel();
      if (loadingTask) {
        void loadingTask.destroy();
      }
      if (pdfDoc) {
        void pdfDoc.cleanup();
      }
    };
  }, [file]);

  if (status === 'error') {
    return (
      <div className="flex h-[100px] w-[80px] shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-rose-600">
        <FileText className="h-7 w-7" />
        <span className="mt-1 text-[10px] font-semibold text-slate-500">
          PDF
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {status === 'loading' && (
        <FileText className="h-6 w-6 animate-pulse text-slate-400" />
      )}
      <canvas
        ref={canvasRef}
        aria-label={`First page thumbnail of ${file.name}`}
        className={`max-h-full max-w-full object-contain ${
          status === 'ready' ? 'block' : 'hidden'
        }`}
      />
    </div>
  );
}

export function FileThumbnail({ toolId, item }: FileThumbnailProps) {
  if (toolId === 'pdf-to-word' || toolId === 'compress-pdf') {
    return <PdfFirstPageThumbnail file={item.file} />;
  }

  if (toolId === 'word-to-pdf') {
    const ext = item.file.name.split('.').pop()?.toUpperCase() ?? 'DOCX';
    return (
      <div className="flex h-[100px] w-[80px] shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-blue-50/50 text-blue-600">
        <FileType2 className="h-7 w-7" />
        <span className="mt-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
          {ext}
        </span>
      </div>
    );
  }

  // compress-image
  return (
    <div className="flex h-[100px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageIcon className="h-7 w-7 text-slate-400" />
      )}
    </div>
  );
}
