export interface ExportColumn { key: string; label: string; format?: 'money' | 'number' }
export interface ExportTable {
  title: string; subtitle: string; columns: ExportColumn[];
  rows: Record<string, string | number | null>[];
}
export type ExportFormat = 'PDF' | 'EXCEL';
