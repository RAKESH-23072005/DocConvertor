import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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

interface BatchResultContextValue {
  session: BatchResultSession | null;
  setSession: (next: BatchResultSession | null) => void;
  updateSessionItems: (
    updater: (prev: BatchFileItem[]) => BatchFileItem[],
  ) => void;
  clearSession: () => void;
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
  const sessionRef = useRef<BatchResultSession | null>(null);
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
    setSessionState((prev) => {
      prev?.items.forEach(revokeBatchItemUrls);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      sessionRef.current?.items.forEach(revokeBatchItemUrls);
    };
  }, []);

  return (
    <BatchResultContext.Provider
      value={{ session, setSession, updateSessionItems, clearSession }}
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
