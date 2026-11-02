export interface RequestOptions { method?: 'GET' | 'POST'; body?: unknown; signal?: AbortSignal }
export interface HttpClient { request<T>(path: string, options?: RequestOptions): Promise<T> }
export class HttpError extends Error {
  constructor(public readonly status: number) { super(`HTTP ${status}`); }
}
export function createHttpClient(fetcher: typeof fetch, timeoutMs = 15000): HttpClient {
  return {
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const controller = new AbortController();
      const abort = () => controller.abort(options.signal?.reason);
      if (options.signal?.aborted) abort();
      options.signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(`/api/${path.replace(/^\//, '')}`, {
          method: options.method ?? 'GET', credentials: 'same-origin', cache: 'no-store',
          headers: options.method === 'POST' ? { 'Content-Type': 'application/json', 'X-Nova-Client': 'web' } : {},
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal,
        });
        if (!response.ok) throw new HttpError(response.status);
        return response.status === 204 ? undefined as T : await response.json() as T;
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
      }
    },
  };
}
