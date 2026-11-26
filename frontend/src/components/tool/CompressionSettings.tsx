import type { PdfCompressionLevel, ToolId } from '../../types/tool';

interface CompressionSettingsProps {
  toolId: ToolId;
  pdfLevel: PdfCompressionLevel;
  onPdfLevelChange: (level: PdfCompressionLevel) => void;
  imageQuality: number;
  onImageQualityChange: (quality: number) => void;
  disabled?: boolean;
}

const PDF_OPTIONS: {
  value: PdfCompressionLevel;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    value: 'recommended',
    title: 'Recommended compression',
    description: 'Good quality, balanced file size reduction.',
    badge: 'Recommended',
  },
  {
    value: 'high',
    title: 'High compression',
    description: 'Smaller file size with moderate image downsampling.',
  },
  {
    value: 'maximum',
    title: 'Maximum compression',
    description: 'Smallest possible size, lower image quality.',
  },
];

export function CompressionSettings({
  toolId,
  pdfLevel,
  onPdfLevelChange,
  imageQuality,
  onImageQualityChange,
  disabled = false,
}: CompressionSettingsProps) {
  if (toolId === 'compress-pdf') {
    const selectedOption = PDF_OPTIONS.find((opt) => opt.value === pdfLevel);

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
            Compression Options
          </h2>
        </div>

        <p className="mt-1.5 text-xs text-slate-500">
          Selected:{' '}
          <span className="font-semibold text-rose-600">
            {selectedOption?.title}
          </span>
        </p>

        <div className="mt-4 space-y-3" role="radiogroup" aria-label="PDF compression level">
          {PDF_OPTIONS.map((option) => {
            const selected = pdfLevel === option.value;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                  selected
                    ? 'border-rose-500 bg-rose-50/60'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pdf-compression-level"
                  value={option.value}
                  checked={selected}
                  onChange={() => onPdfLevelChange(option.value)}
                  className="mt-1 h-4 w-4 accent-rose-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {option.title}
                    </span>
                    {option.badge && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {option.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (toolId === 'compress-image') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
            Compression Quality
          </h2>
          <span
            data-testid="quality-percentage"
            className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"
          >
            {imageQuality}%
          </span>
        </div>

        <div className="mt-4">
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            disabled={disabled}
            value={imageQuality}
            onChange={(e) => onImageQualityChange(Number(e.target.value))}
            aria-label="Compression quality percentage"
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>10% (Smallest)</span>
            <span>100% (Best quality)</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'High', value: 50 },
            { label: 'Recommended', value: 75 },
            { label: 'Light', value: 95 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={disabled}
              onClick={() => onImageQualityChange(preset.value)}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                imageQuality === preset.value
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {preset.label} ({preset.value}%)
            </button>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Applies to JPEG and WebP. PNG files remain lossless to preserve
          transparency and are not converted to JPEG.
        </p>
      </div>
    );
  }

  return null;
}
