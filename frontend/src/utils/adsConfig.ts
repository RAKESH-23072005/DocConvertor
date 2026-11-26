export type AdPlacementKey =
  | 'home-mid'
  | 'home-lower'
  | 'tool-bottom'
  | 'download-sidebar';

export interface AdsConfig {
  enabled: boolean;
  previewMode: boolean;
  clientId: string;
  slots: Record<AdPlacementKey, string>;
}

export function getAdsConfig(): AdsConfig {
  return {
    enabled: import.meta.env.VITE_ADS_ENABLED === 'true',
    previewMode: import.meta.env.VITE_ADS_PREVIEW_MODE === 'true',
    clientId: (import.meta.env.VITE_ADSENSE_CLIENT_ID ?? '').trim(),
    slots: {
      'home-mid': (import.meta.env.VITE_ADSENSE_SLOT_HOME_MID ?? '').trim(),
      'home-lower': (import.meta.env.VITE_ADSENSE_SLOT_HOME_LOWER ?? '').trim(),
      'tool-bottom': (
        import.meta.env.VITE_ADSENSE_SLOT_TOOL_BOTTOM ?? ''
      ).trim(),
      'download-sidebar': (
        import.meta.env.VITE_ADSENSE_SLOT_DOWNLOAD_SIDEBAR ?? ''
      ).trim(),
    },
  };
}

export function hasConfiguredAdSlot(placement: AdPlacementKey): boolean {
  const config = getAdsConfig();
  return (
    config.enabled &&
    Boolean(config.clientId) &&
    Boolean(config.slots[placement])
  );
}
