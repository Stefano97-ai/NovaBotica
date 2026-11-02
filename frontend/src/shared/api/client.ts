export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/${path.replace(/^\//, '')}`, { credentials: 'same-origin', signal });
  if (!response.ok) throw new Error(`Error de API: ${response.status}`);
  return response.json() as Promise<T>;
}
