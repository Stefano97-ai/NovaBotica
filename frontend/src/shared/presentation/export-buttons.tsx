import { FileSpreadsheet, FileText } from 'lucide-react';
import type { ExportFormat } from '../domain/table-export';
import './export-buttons.css';
export function ExportButtons({busy,disabled,onExport}:{busy:boolean;disabled?:boolean;onExport:(format:ExportFormat)=>void}) {
  return <div className="nova-export-bar"><div className="nova-export-dock" aria-label="Exportar resultados">
    <button type="button" disabled={busy||disabled} className="nova-export-btn nova-export-pdf" title="Exportar a PDF" aria-label="Exportar a PDF" onClick={()=>onExport('PDF')}><FileText size={15}/></button>
    <button type="button" disabled={busy||disabled} className="nova-export-btn nova-export-excel" title="Exportar a Excel (.xlsx)" aria-label="Exportar a Excel" onClick={()=>onExport('EXCEL')}><FileSpreadsheet size={15}/></button>
  </div>{busy&&<span role="status">Preparando archivo…</span>}</div>;
}
