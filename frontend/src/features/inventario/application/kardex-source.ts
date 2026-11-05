import type { KardexFilters, KardexOptions, KardexPage } from '../domain/kardex';
import type { ExportFormat } from '../../../shared/domain/table-export';
export interface KardexSource {
  options(signal: AbortSignal): Promise<KardexOptions>;
  list(filters: KardexFilters, limit: number, offset: number, signal: AbortSignal): Promise<KardexPage>;
  export(filters: KardexFilters, format: ExportFormat): Promise<void>;
}
