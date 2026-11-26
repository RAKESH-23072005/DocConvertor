import type { BatchFileItem } from '../types/tool';

export const DEFAULT_BATCH_CONCURRENCY = (() => {
  const raw = Number(import.meta.env.VITE_BATCH_CONCURRENCY);
  return Number.isInteger(raw) && raw >= 1 && raw <= 4 ? raw : 2;
})();

export interface ConcurrentBatchOptions<TResult> {
  items: BatchFileItem[];
  concurrency?: number;
  signal?: AbortSignal;
  processItem: (
    item: BatchFileItem,
    onProgress: (percent: number) => void,
    signal?: AbortSignal,
  ) => Promise<TResult>;
  onItemUpdate: (
    id: string,
    patch: Partial<
      Pick<BatchFileItem, 'status' | 'progress' | 'error' | 'result'>
    >,
  ) => void;
}

/**
 * Processes all 'waiting' items in a batch queue with controlled concurrency.
 * Each item's lifecycle is isolated: a failure in one item never aborts others.
 */
export async function runConcurrentBatch<TResult extends BatchFileItem['result']>(
  options: ConcurrentBatchOptions<TResult>,
): Promise<void> {
  const {
    items,
    concurrency = DEFAULT_BATCH_CONCURRENCY,
    signal,
    processItem,
    onItemUpdate,
  } = options;

  const pending = items.filter((item) => item.status === 'waiting');
  if (pending.length === 0) return;

  let cursor = 0;

  async function worker() {
    while (cursor < pending.length) {
      if (signal?.aborted) return;

      const idx = cursor;
      cursor += 1;
      const item = pending[idx];
      if (!item) return;

      try {
        onItemUpdate(item.id, {
          status: 'processing',
          progress: 5,
          error: undefined,
        });

        const result = await processItem(
          item,
          (pct) =>
            onItemUpdate(item.id, { status: 'processing', progress: pct }),
          signal,
        );

        onItemUpdate(item.id, {
          status: 'completed',
          progress: 100,
          result,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          onItemUpdate(item.id, { status: 'waiting', progress: 0 });
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Unexpected processing error.';
        onItemUpdate(item.id, {
          status: 'failed',
          progress: 0,
          error: message,
        });
      }
    }
  }

  const workerCount = Math.min(concurrency, pending.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}
