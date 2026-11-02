import type { Summary, SummaryRepository } from '../domain/summary';
import type { HttpClient } from '../../../shared/infrastructure/http-client';
import { mapHttpError } from '../../../shared/infrastructure/map-http-error';
export function createHttpSummaryRepository(http: HttpClient): SummaryRepository {
  return { async getSummary(signal) {
    try { return await http.request<Summary>('inicio', { signal }); }
    catch (error) { throw mapHttpError(error); }
  } };
}
