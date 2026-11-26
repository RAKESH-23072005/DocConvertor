import type { BatchFileItem, BatchFileResult } from '../types/tool';
import { runConcurrentBatch } from '../utils/batchRunner';
import { uploadFileForBlob } from './apiClient';

function stripExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(0, idx) : name;
}

export async function convertWordToPdfApi(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<BatchFileResult> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  const { blob } = await uploadFileForBlob(
    '/word-to-pdf',
    formData,
    onProgress,
    signal,
  );

  return {
    isMockPreview: false,
    outputFileName: `${stripExtension(file.name)}.pdf`,
    outputExtension: '.pdf',
    originalSize: file.size,
    compressedSize: blob.size,
    savedPercent: 0,
    isLargerThanOriginal: false,
    blob,
  };
}

export function runRealWordToPdfBatch(options: {
  items: BatchFileItem[];
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
      convertWordToPdfApi(item.file, onProgress, signal),
    onItemUpdate: options.onItemUpdate,
  });
}
