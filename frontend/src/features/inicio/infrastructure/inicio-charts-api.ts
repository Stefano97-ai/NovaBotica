import { ChartsRequestError, type LoadInicioCharts } from '../application/inicio-charts-port';

export const loadInicioCharts: LoadInicioCharts = async (days, signal) => {
  const response = await fetch(`/api/inicio/graficos?days=${days}`, {
    credentials: 'same-origin', cache: 'no-store', signal,
  });
  if (!response.ok) throw new ChartsRequestError(response.status);
  return response.json();
};
