import type { ChartPeriod, InicioCharts } from '../domain/inicio-charts';

export type LoadInicioCharts = (days: ChartPeriod, signal: AbortSignal) => Promise<InicioCharts>;
export class ChartsRequestError extends Error {
  constructor(public readonly status: number) { super('No se pudieron cargar los gráficos'); }
}
