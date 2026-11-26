import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface DocumentMetaOptions {
  title: string;
  description: string;
  noIndex?: boolean;
}

function upsertMeta(attrName: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${key}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useDocumentMeta({
  title,
  description,
  noIndex = false,
}: DocumentMetaOptions) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta(
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow',
    );

    const configuredOrigin = (import.meta.env.VITE_SITE_URL ?? '')
      .trim()
      .replace(/\/+$/, '');
    const origin = configuredOrigin || window.location.origin;
    const canonicalUrl = `${origin}${pathname === '/' ? '' : pathname}`;

    upsertMeta('property', 'og:url', canonicalUrl);

    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [title, description, noIndex, pathname]);
}
