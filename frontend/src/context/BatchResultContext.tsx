import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { runRealCompressPdfBatch } from '../services/compressPdfService';
import { runBrowserImageBatch } from '../services/imageCompressionService';
import { runRealPdfToWordBatch } from '../services/pdfToWordService';
import { runRealWordToPdfBatch } from '../services/wordToPdfService';
import type {
  BatchFileItem,
  PdfCompressionLevel,
  ToolId,
} from '../types/tool';

export interface BatchResultSession {
  toolId: ToolId;
  items: BatchFileItem[];
  pdfLevel: PdfCompressionLevel;
  imageQuality: number;
  createdAt: number;
}

export type BatchProcessingStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'cancelled';

interface StartBatchOptions {
  toolId: ToolId;
  items: BatchFileItem[];
  pdfLevel: PdfCompressionLevel;
  imageQuality: number;
}

interface BatchResultContextValue {
  session: BatchResultSession | null;
  batchStatus: BatchProcessingStatus;
  setSession: (next: BatchResultSession | null) => void;
  updateSessionItems: (
    updater: (prev: BatchFileItem[]) => BatchFileItem[],
  ) => void;
  clearSession: () => void;
  startBatchProcessing: (options: StartBatchOptions) => void;
  cancelBatchProcessing: () => void;
}

const BatchResultContext = createContext<BatchResultContextValue | null>(null);

export function revokeBatchItemUrls(item: BatchFileItem) {
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
  if (item.result?.compressedPreviewUrl) {
    URL.revokeObjectURL(item.result.compressedPreviewUrl);
  }
}

export function BatchResultProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSessionState] = useState<BatchResultSession | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchProcessingStatus>('idle');
  const sessionRef = useRef<BatchResultSession | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  sessionRef.current = session;

  const setSession = useCallback((next: BatchResultSession | null) => {
    setSessionState((prev) => {
      if (prev && prev !== next) {
        const nextIds = new Set(next?.items.map((i) => i.id) ?? []);
        prev.items.forEach((item) => {
          if (!nextIds.has(item.id)) {
            revokeBatchItemUrls(item);
          }
        });
      }
      return next;
    });
  }, []);

  const updateSessionItems = useCallback(
    (updater: (prev: BatchFileItem[]) => BatchFileItem[]) => {
      setSessionState((prev) => {
        if (!prev) return prev;
        return { ...prev, items: updater(prev.items) };
      });
    },
    [],
  );

  const clearSession = useCallback(() => {
    abortControllerRef.current?.abort();
    setBatchStatus('idle');
    setSessionState((prev) => {
      prev?.items.forEach(revokeBatchItemUrls);
      return null;
    });
  }, []);

  const cancelBatchProcessing = useCallback(() => {
    abortControllerRef.current?.abort();
    setBatchStatus('cancelled');
  }, []);

  const startBatchProcessing = useCallback(
    (options: StartBatchOptions) => {
      const { toolId, items, pdfLevel, imageQuality } = options;
      const waiting = items.filter((item) => item.status === 'waiting');
      if (waiting.length === 0) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setBatchStatus('running');
      setSession({
        toolId,
        items,
        pdfLevel,
        imageQuality,
        createdAt: Date.now(),
      });

      const onItemUpdate = (
        id: string,
        patch: Partial<
          Pick<BatchFileItem, 'status' | 'progress' | 'error' | 'result'>
        >,
      ) => {
        setSessionState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          };
        });
      };

      const runPromise =
        toolId === 'pdf-to-word'
          ? runRealPdfToWordBatch({
              items,
              signal: controller.signal,
              onItemUpdate,
            })
          : toolId === 'word-to-pdf'
            ? runRealWordToPdfBatch({
                items,
                signal: controller.signal,
                onItemUpdate,
              })
            : toolId === 'compress-pdf'
              ? runRealCompressPdfBatch({
                  items,
                  level: pdfLevel,
                  signal: controller.signal,
                  onItemUpdate,
                })
              : runBrowserImageBatch({
                  items,
                  quality: imageQuality,
                  signal: controller.signal,
                  onItemUpdate,
                });

      void runPromise.then(() => {
        if (abortControllerRef.current === controller) {
          setBatchStatus(controller.signal.aborted ? 'cancelled' : 'completed');
        }
      });
    },
    [setSession],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      sessionRef.current?.items.forEach(revokeBatchItemUrls);
    };
  }, []);

  return (
    <BatchResultContext.Provider
      value={{
        session,
        batchStatus,
        setSession,
        updateSessionItems,
        clearSession,
        startBatchProcessing,
        cancelBatchProcessing,
      }}
    >
      {children}
    </BatchResultContext.Provider>
  );
}

export function useBatchResult(): BatchResultContextValue {
  const ctx = useContext(BatchResultContext);
  if (!ctx) {
    throw new Error('useBatchResult must be used within BatchResultProvider');
  }
  return ctx;
}
