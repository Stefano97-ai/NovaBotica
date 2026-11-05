import { useEffect, useState } from 'react';
import { ChartsRequestError, type LoadInicioCharts } from '../application/inicio-charts-port';
import type { ChartPeriod, InicioCharts } from '../domain/inicio-charts';

export function useInicioCharts(load: LoadInicioCharts, days: ChartPeriod, version: number, onUnauthorized: () => void) {
  const [data, setData] = useState<InicioCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => controller.abort(), 15000);
    load(days, controller.signal).then(result => {
      if (active) setData(result);
    }).catch(reason => {
      if (!active) return;
      if (reason instanceof ChartsRequestError && reason.status === 401) onUnauthorized();
      else setError(true);
    }).finally(() => {
      clearTimeout(timer);
      if (active) setLoading(false);
    });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [load, days, version, onUnauthorized]);
  return { data, loading, error };
}
