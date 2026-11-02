import type { Summary, SummaryRepository } from '../domain/summary';
export interface InicioUseCases { getSummary(signal?: AbortSignal): Promise<Summary> }
export function createInicioUseCases(repository: SummaryRepository): InicioUseCases {
  return { getSummary: signal => repository.getSummary(signal) };
}
