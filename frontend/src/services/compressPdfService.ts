import type {
  BatchFileItem,
  BatchFileResult,
  PdfCompressionLevel,
} from '../types/tool';
import { runConcurrentBatch } from '../utils/batchRunner';
import { uploadFileForBlob } from './apiClient';

function stripExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(0, idx) : name;
}

export async function compressPdfApi(
  file: File,
  level: PdfCompressionLevel,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<BatchFileResult> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('level', level);

  const { blob, headers } = await uploadFileForBlob(
    '/compress-pdf',
    formData,
    onProgress,
    signal,
  );

  const origHeader = Number(headers.get('X-Original-Size'));
  const compHeader = Number(headers.get('X-Compressed-Size'));
  const savedHeader = Number(headers.get('X-Saved-Percent'));
  const preservedHeader = headers.get('X-Preserved-Original') === 'true';

  const originalSize =
    Number.isFinite(origHeader) && origHeader > 0 ? origHeader : file.size;
  const compressedSize =
    Number.isFinite(compHeader) && compHeader > 0 ? compHeader : blob.size;
  const savedPercent = Number.isFinite(savedHeader)
    ? savedHeader
    : Math.max(
        0,
        Math.round(((originalSize - compressedSize) / originalSize) * 100),
      );

  return {
    isMockPreview: false,
    outputFileName: `${stripExtension(file.name)}-compressed.pdf`,
    outputExtension: '.pdf',
    originalSize,
    compressedSize,
    savedPercent,
    isLargerThanOriginal: preservedHeader || compressedSize >= originalSize,
    selectedOptionLabel: level,
    blob,
  };
}

export function runRealCompressPdfBatch(options: {
  items: BatchFileItem[];
  level: PdfCompressionLevel;
  concurrency?: number;
  signal?: AbortSignal;
  onItemUpdate: (
    id: string,
    patch: Partial<
      Pick<BatchFileItem, 'status' | 'progress' | 'error' | 'result'>
    >,
  ) => void;
}): Promise<void> {
  return runConcurrentBatch({
    items: options.items,
    concurrency: options.concurrency,
    signal: options.signal,
    processItem: (item, onProgress, signal) =>
      compressPdfApi(item.file, options.level, onProgress, signal),
    onItemUpdate: options.onItemUpdate,
  });
}
