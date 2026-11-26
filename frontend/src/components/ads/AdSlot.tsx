import { useEffect, useRef } from 'react';
import { getAdsConfig, type AdPlacementKey } from '../../utils/adsConfig';
import { ensureAdSenseScriptLoaded } from '../../utils/adsenseLoader';

interface AdSlotProps {
  placement: AdPlacementKey;
  variant?: 'banner' | 'sidebar';
  allowPreview?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  placement,
  variant = 'banner',
  allowPreview = true,
  className = '',
}: AdSlotProps) {
  const config = getAdsConfig();
  const pushedRef = useRef(false);

  const slotId = config.slots[placement];
  const canRenderLive =
    config.enabled && Boolean(config.clientId) && Boolean(slotId);
  const canRenderPreview =
    allowPreview && !config.enabled && config.previewMode;

  useEffect(() => {
    if (!canRenderLive || pushedRef.current) return;
    ensureAdSenseScriptLoaded(config.clientId);
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // Ignore AdSense push errors when blocked by browser extensions
    }
  }, [canRenderLive, config.clientId]);

  if (!canRenderLive && !canRenderPreview) {
    return null;
  }

  const wrapperClass =
    variant === 'sidebar'
      ? className
      : `mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 ${className}`;

  const minHeightClass = variant === 'sidebar' ? 'min-h-[250px]' : 'min-h-[90px]';

  return (
    <aside aria-label="Advertisement" className={wrapperClass}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Advertisement
        </p>

        {canRenderLive ? (
          <ins
            className={`adsbygoogle block ${minHeightClass}`}
            data-ad-client={config.clientId}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div
            className={`flex ${minHeightClass} items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-xs text-slate-500`}
          >
            Responsive AdSense Test Placement ({placement})
          </div>
        )}
      </div>
    </aside>
  );
}
