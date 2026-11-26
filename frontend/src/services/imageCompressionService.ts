import type { BatchFileItem, BatchFileResult } from '../types/tool';
import { runConcurrentBatch } from '../utils/batchRunner';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function stripExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(0, idx) : name;
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(idx).toLowerCase() : '';
}

function resolveTargetMime(file: File): 'image/jpeg' | 'image/png' | 'image/webp' {
  const ext = getExtension(file.name);
  if (ext === '.png' || file.type === 'image/png') return 'image/png';
  if (ext === '.webp' || file.type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function decodeImage(
  file: File,
): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
      .then((bitmap) => ({
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx: CanvasRenderingContext2D) => ctx.drawImage(bitmap, 0, 0),
        cleanup: () => bitmap.close(),
      }))
      .catch(() => {
        throw new Error(
          `Unable to decode "${file.name}". The image may be corrupted or unsupported.`,
        );
      });
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        draw: (ctx: CanvasRenderingContext2D) => ctx.drawImage(img, 0, 0),
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          `Unable to decode "${file.name}". The image may be corrupted or unsupported.`,
        ),
      );
    };
    img.src = objectUrl;
  });
}

/**
 * Compresses a single image locally in the browser using the HTML Canvas API.
 * Preserves original dimensions and transparency (for PNG/WebP).
 */
export async function compressImageInBrowser(
  file: File,
  qualityPercent: number,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<BatchFileResult> {
  if (signal?.aborted) {
    throw new DOMException('Batch cancelled', 'AbortError');
  }

  onProgress(15);
  const decoded = await decodeImage(file);

  if (signal?.aborted) {
    decoded.cleanup();
    throw new DOMException('Batch cancelled', 'AbortError');
  }

  const { width, height } = decoded;
  if (width <= 0 || height <= 0) {
    decoded.cleanup();
    throw new Error(`"${file.name}" has invalid image dimensions.`);
  }

  onProgress(40);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    decoded.cleanup();
    throw new Error('Browser Canvas 2D context is unavailable.');
  }

  try {
    decoded.draw(ctx);
  } catch {
    decoded.cleanup();
    canvas.width = 0;
    canvas.height = 0;
    throw new Error(
      `Failed to render "${file.name}" onto Canvas. The image may exceed browser memory limits.`,
    );
  } finally {
    decoded.cleanup();
  }

  onProgress(70);

  const targetMime = resolveTargetMime(file);
  const normalizedQuality = Math.max(0.1, Math.min(1, qualityPercent / 100));

  const encodedBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (result) => resolve(result),
      targetMime,
      targetMime === 'image/png' ? undefined : normalizedQuality,
    );
  });

  // Immediately release canvas backing memory
  canvas.width = 0;
  canvas.height = 0;

  if (!encodedBlob || encodedBlob.size === 0) {
    throw new Error(`Browser failed to encode "${file.name}".`);
  }

  onProgress(100);

  const originalSize = file.size;
  const attemptedSize = encodedBlob.size;
  const isLargerOrEqual = attemptedSize >= originalSize;

  // Check actual resulting MIME type before assigning extension
  const actualMime = encodedBlob.type || targetMime;
  const originalExt = getExtension(file.name);
  const resolvedExt =
    actualMime === 'image/jpeg' && originalExt === '.jpeg'
      ? '.jpeg'
      : MIME_TO_EXT[actualMime] ?? (originalExt || '.png');

  const baseName = stripExtension(file.name);

  if (isLargerOrEqual) {
    const increasePercent = Math.round(
      ((attemptedSize - originalSize) / originalSize) * 100,
    );
    return {
      isMockPreview: false,
      outputFileName: file.name,
      outputExtension: originalExt || resolvedExt,
      originalSize,
      compressedSize: originalSize,
      attemptedSize,
      sizeIncreasePercent: increasePercent,
      savedPercent: 0,
      isLargerThanOriginal: true,
      originalDimensions: { width, height },
      compressedDimensions: { width, height },
      compressedPreviewUrl: URL.createObjectURL(file),
      selectedOptionLabel:
        targetMime === 'image/png'
          ? 'PNG (lossless, transparency preserved)'
          : `Quality ${qualityPercent}%`,
      blob: file,
    };
  }

  const savedPercent = Math.round(
    ((originalSize - attemptedSize) / originalSize) * 100,
  );

  return {
    isMockPreview: false,
    outputFileName: `${baseName}-compressed${resolvedExt}`,
    outputExtension: resolvedExt,
    originalSize,
    compressedSize: attemptedSize,
    savedPercent,
    isLargerThanOriginal: false,
    originalDimensions: { width, height },
    compressedDimensions: { width, height },
    compressedPreviewUrl: URL.createObjectURL(encodedBlob),
    selectedOptionLabel:
      targetMime === 'image/png'
        ? 'PNG (lossless, transparency preserved)'
        : `Quality ${qualityPercent}%`,
    blob: encodedBlob,
  };
}

export interface BrowserImageBatchOptions {
  items: BatchFileItem[];
  quality: number;
  concurrency?: number;
  signal?: AbortSignal;
  onItemUpdate: (
    id: string,
    patch: Partial<
      Pick<BatchFileItem, 'status' | 'progress' | 'error' | 'result'>
    >,
  ) => void;
}

/**
 * Processes an image batch locally in the browser with controlled concurrency (default: 2).
 */
export function runBrowserImageBatch(
  options: BrowserImageBatchOptions,
): Promise<void> {
  return runConcurrentBatch({
    items: options.items,
    concurrency: options.concurrency,
    signal: options.signal,
    processItem: (item, onProgress, signal) =>
      compressImageInBrowser(item.file, options.quality, onProgress, signal),
    onItemUpdate: options.onItemUpdate,
  });
}
