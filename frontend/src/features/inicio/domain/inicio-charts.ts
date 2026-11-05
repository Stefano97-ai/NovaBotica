export interface DailySale { date: string; count: number; total: string }
export interface ProductSale { id: string; name: string; units: number; total: string }
export interface HourlySale { hour: number; count: number; total: string }
export interface CategorySale { id: string; name: string; units: number; total: string }
export interface CriticalStock { id: string; name: string; available: number; minimum: number; shortage: number }
export interface ExpiryBucket { label: string; lots: number; units: number }
export interface InicioCharts {
  from: string;
  to: string;
  days: number;
  sales: { evolution: DailySale[]; topProducts: ProductSale[]; byHour: HourlySale[]; byCategory: CategorySale[] } | null;
  criticalStock: CriticalStock[];
  expirations: ExpiryBucket[];
}
export type ChartPeriod = 7 | 30 | 90;
