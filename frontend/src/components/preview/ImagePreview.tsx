import { useState } from 'react';
import { formatFileSize } from '../../utils/formatters';

interface ImagePreviewProps {
  src: string;
  alt: string;
  title?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
}

export function ImagePreview({
  src,
  alt,
  title,
  fileSize,
  dimensions,
}: ImagePreviewProps) {
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const dims = dimensions ?? naturalSize;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {(title || dims || fileSize !== undefined) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">
            {title ?? 'Image Preview'}
          </span>
          <div className="flex items-center gap-3">
            {dims && (
              <span>
                {dims.width} &times; {dims.height} px
              </span>
            )}
            {fileSize !== undefined && <span>{formatFileSize(fileSize)}</span>}
          </div>
        </div>
      )}

      <div
        className="flex max-h-[420px] items-center justify-center overflow-auto p-4"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
        }}
      >
        <img
          src={src}
          alt={alt}
          onLoad={(e) => {
            const img = e.currentTarget;
            setNaturalSize({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          }}
          className="max-h-[380px] max-w-full rounded object-contain shadow-sm"
        />
      </div>
    </div>
  );
}
