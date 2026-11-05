import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertsError, type AlertsRepository } from '../application/alerts-repository';
import { defaultFilters, type Alert, type AlertsPage } from '../domain/alert';

interface AlertsContextValue {
  source: AlertsRepository; preview: AlertsPage | null; error: string; loading: boolean; version: number;
  refresh(): Promise<void>; read(alert: Alert): Promise<void>; readAll(): Promise<void>;
}
const Context = createContext<AlertsContextValue | null>(null);
export function AlertsProvider({ source, refreshKey, onUnauthorized, children }: {
  source: AlertsRepository; refreshKey: string; onUnauthorized(): void; children: ReactNode;
}) {
  const [preview, setPreview] = useState<AlertsPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    const requestId = ++sequence.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 15000);
    setLoading(true);
    try {
      const result = await source.list({ ...defaultFilters, noLeidas: true, limit: 5 }, abort.signal);
      if (sequence.current === requestId) { setPreview(result); setError(''); setVersion(v => v + 1); }
    } catch (reason) {
      if (sequence.current !== requestId) return;
      if (reason instanceof AlertsError && reason.status === 401) onUnauthorized();
      else setError('No pudimos actualizar las alertas. Los datos anteriores pueden estar desactualizados.');
    } finally {
      clearTimeout(timer);
      if (sequence.current === requestId) setLoading(false);
    }
  }, [source, onUnauthorized]);
  useEffect(() => {
    const visibleRefresh = () => { if (!document.hidden) void refresh(); };
    const timer = setInterval(visibleRefresh, 60000);
    window.addEventListener('focus', visibleRefresh);
    window.addEventListener('nova-inventory-changed', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => {
      sequence.current++; controller.current?.abort(); clearInterval(timer);
      window.removeEventListener('focus', visibleRefresh); window.removeEventListener('nova-inventory-changed', visibleRefresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
    };
  }, [refresh]);
  useEffect(() => { void refresh(); }, [refreshKey, refresh]);
  const read = useCallback(async (alert: Alert) => { await source.read(alert.id, alert.version); await refresh(); }, [source, refresh]);
  const readAll = useCallback(async () => { await source.readAll(); await refresh(); }, [source, refresh]);
  return <Context.Provider value={{ source, preview, error, loading, version, refresh, read, readAll }}>{children}</Context.Provider>;
}
export function useAlerts() {
  const value = useContext(Context);
  if (!value) throw new Error('Falta el proveedor de alertas');
  return value;
}
