export type ToolId =
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'compress-pdf'
  | 'compress-image';

export type PdfCompressionLevel = 'recommended' | 'high' | 'maximum';

export type BatchItemStatus = 'waiting' | 'processing' | 'completed' | 'failed';

export interface BatchFileResult {
  isMockPreview: boolean;
  outputFileName: string;
  outputExtension: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  isLargerThanOriginal: boolean;
  attemptedSize?: number;
  sizeIncreasePercent?: number;
  originalDimensions?: { width: number; height: number };
  compressedDimensions?: { width: number; height: number };
  compressedPreviewUrl?: string;
  selectedOptionLabel?: string;
  blob?: Blob;
}

export interface BatchFileItem {
  id: string;
  file: File;
  previewUrl?: string;
  status: BatchItemStatus;
  progress: number;
  error?: string;
  result?: BatchFileResult;
}

export interface ToolDefinition {
  id: ToolId;
  title: string;
  shortTitle: string;
  description: string;
  route: string;
  acceptedExtensions: string[];
  acceptedMimeTypes: string;
  supportedFormatsLabel: string;
  maxFileSizeMb: number;
  multiple: boolean;
  ctaLabel: string;
  actionLabel: string;
  accentColor: 'rose' | 'blue' | 'emerald' | 'amber';
  layoutNote?: string;
}
