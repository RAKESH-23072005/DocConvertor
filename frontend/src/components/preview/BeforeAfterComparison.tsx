import { useState } from 'react';
import { formatFileSize } from '../../utils/formatters';
import { ImagePreview } from './ImagePreview';

interface BeforeAfterComparisonProps {
  originalUrl: string;
  compressedUrl: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  isLargerThanOriginal: boolean;
  attemptedSize?: number;
  sizeIncreasePercent?: number;
  originalDimensions?: { width: number; height: number };
  compressedDimensions?: { width: number; height: number };
}

export function BeforeAfterComparison(props: BeforeAfterComparisonProps) {
  const [imageView, setImageView] = useState<
    'slider' | 'side-by-side' | 'original' | 'compressed'
  >('slider');
  const [sliderPos, setSliderPos] = useState<number>(50);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span>
            Original: <strong>{formatFileSize(props.originalSize)}</strong>
          </span>
          <span>
            Compressed:{' '}
            <strong className="text-emerald-700">
              {formatFileSize(props.compressedSize)}
            </strong>
          </span>
          {props.isLargerThanOriginal ? (
            <span className="font-semibold text-amber-700">
              No reduction
              {props.attemptedSize
                ? ` (${formatFileSize(props.attemptedSize)}, +${props.sizeIncreasePercent ?? 0}%)`
                : ''}{' '}
              — original preserved
            </span>
          ) : (
            <span className="font-semibold text-emerald-700">
              Saved {props.savedPercent}%
            </span>
          )}
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
          {(
            [
              { id: 'slider', label: 'Slider' },
              { id: 'side-by-side', label: 'Side-by-Side' },
              { id: 'original', label: 'Original' },
              { id: 'compressed', label: 'Compressed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setImageView(tab.id)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                imageView === tab.id
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {imageView === 'slider' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Original ({formatFileSize(props.originalSize)})</span>
            <span>Drag slider: {sliderPos}%</span>
            <span>Compressed ({formatFileSize(props.compressedSize)})</span>
          </div>

          <div
            className="relative mx-auto flex max-h-[400px] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 select-none"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
            }}
          >
            <img
              src={props.compressedUrl}
              alt={`Compressed ${props.fileName}`}
              className="max-h-[380px] w-full object-contain"
            />

            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={props.originalUrl}
                alt={`Original ${props.fileName}`}
                className="max-h-[380px] w-full object-contain"
              />
            </div>

            <div
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-rose-600 shadow"
              style={{ left: `${sliderPos}%` }}
            />
          </div>

          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label="Before and after image comparison slider"
              className="h-2 w-full cursor-ew-resize appearance-none rounded-lg bg-slate-200 accent-rose-600"
            />
          </div>
        </div>
      )}

      {imageView === 'side-by-side' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ImagePreview
            src={props.originalUrl}
            alt={`Original ${props.fileName}`}
            title="Original"
            fileSize={props.originalSize}
            dimensions={props.originalDimensions}
          />
          <ImagePreview
            src={props.compressedUrl}
            alt={`Compressed ${props.fileName}`}
            title="Compressed"
            fileSize={props.compressedSize}
            dimensions={props.compressedDimensions}
          />
        </div>
      )}

      {imageView === 'original' && (
        <ImagePreview
          src={props.originalUrl}
          alt={`Original ${props.fileName}`}
          title="Original"
          fileSize={props.originalSize}
          dimensions={props.originalDimensions}
        />
      )}

      {imageView === 'compressed' && (
        <ImagePreview
          src={props.compressedUrl}
          alt={`Compressed ${props.fileName}`}
          title="Compressed"
          fileSize={props.compressedSize}
          dimensions={props.compressedDimensions}
        />
      )}
    </div>
  );
}
