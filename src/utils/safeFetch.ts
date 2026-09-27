// Safe Fetch: Proxies network requests through background service worker
// to bypass webpage Content Security Policy (CSP) and CORS restrictions.

export interface SafeResponse {
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
  json: () => Promise<any>;
}

export async function safeFetch(url: string, options?: RequestInit): Promise<SafeResponse> {
  // If running in Chrome Extension environment, proxy via background service worker
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      // Serialize headers and body for postMessage
      const serializableOptions: any = {};
      if (options?.method) serializableOptions.method = options.method;
      if (options?.headers) {
        if (options.headers instanceof Headers) {
          const h: Record<string, string> = {};
          options.headers.forEach((v, k) => { h[k] = v; });
          serializableOptions.headers = h;
        } else {
          serializableOptions.headers = options.headers;
        }
      }
      if (options?.body) {
        serializableOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      }

      const res = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'PROXY_FETCH',
            url,
            options: serializableOptions,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (!response) {
              reject(new Error('No response from background proxy'));
            } else if (!response.success) {
              reject(new Error(response.error || 'Network proxy error'));
            } else {
              resolve(response);
            }
          }
        );
      });

      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        text: async () => res.text,
        json: async () => JSON.parse(res.text),
      };
    } catch (err) {
      console.warn('Background proxy fetch failed, falling back to direct fetch:', err);
    }
  }

  // Fallback to direct fetch (e.g. standalone demo harness or options page)
  const response = await fetch(url, options);
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    text: () => response.text(),
    json: () => response.json(),
  };
}
