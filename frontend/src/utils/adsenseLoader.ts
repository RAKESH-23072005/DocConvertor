let scriptRequested = false;

/**
 * Loads the Google AdSense script at most once when ads are enabled
 * and a valid publisher client ID is configured.
 */
export function ensureAdSenseScriptLoaded(clientId: string): void {
  if (typeof document === 'undefined' || !clientId) return;
  if (
    scriptRequested ||
    document.querySelector('script[data-docconvertor-adsense="true"]')
  ) {
    return;
  }

  scriptRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  script.dataset.docconvertorAdsense = 'true';
  document.head.appendChild(script);
}
