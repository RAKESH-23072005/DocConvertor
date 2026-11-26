export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api');

export const REQUEST_TIMEOUT_MS = 125_000;

export function resolveHealthCheckUrl(baseUrl: string = API_BASE_URL): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  const rootBase = normalizedBase.endsWith('/api')
    ? normalizedBase.slice(0, -4)
    : normalizedBase;
  return `${rootBase}/api/health`;
}

export async function apiGet<T>(path: string, useRawUrl = false): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  const requestUrl = useRawUrl ? path : `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API request failed (${response.status}): ${path}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface UploadBlobResponse {
  blob: Blob;
  headers: {
    get: (name: string) => string | null;
  };
}

/**
 * Centralized multipart file upload helper using XMLHttpRequest for upload progress,
 * configurable timeouts, and structured FastAPI error parsing.
 */
export function uploadFileForBlob(
  endpointPath: string,
  formData: FormData,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<UploadBlobResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${endpointPath}`, true);
    xhr.responseType = 'blob';
    xhr.timeout = REQUEST_TIMEOUT_MS;

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException('Batch cancelled', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const uploadPct = Math.round((event.loaded / event.total) * 60);
        onProgress(Math.max(10, uploadPct));
      }
    };

    xhr.upload.onload = () => {
      onProgress(75);
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response as Blob;
        if (!blob || blob.size === 0) {
          reject(new Error('Server returned an empty file.'));
          return;
        }
        onProgress(100);
        resolve({
          blob,
          headers: {
            get: (name: string) => xhr.getResponseHeader(name),
          },
        });
        return;
      }

      let message = `Request failed (HTTP ${xhr.status}).`;
      try {
        const text = await (xhr.response as Blob).text();
        const parsed = JSON.parse(text) as { detail?: string };
        if (parsed.detail) {
          message = parsed.detail;
        }
      } catch {
        // Keep fallback status message
      }
      reject(new Error(message));
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Backend service is unavailable. Please ensure the FastAPI server is running.',
        ),
      );
    };

    xhr.ontimeout = () => {
      reject(new Error('Request timed out while processing this file.'));
    };

    xhr.onabort = () => {
      reject(new DOMException('Batch cancelled', 'AbortError'));
    };

    xhr.send(formData);
  });
}
