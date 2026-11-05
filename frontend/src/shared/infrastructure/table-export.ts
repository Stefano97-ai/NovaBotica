import type { ExportFormat, ExportTable } from '../domain/table-export';

export async function buildTableExport(table: ExportTable, format: ExportFormat): Promise<Blob> {
  if (table.rows.length > 100000) throw new Error('Acota los filtros para exportar hasta 100000 filas.');
  if (format === 'PDF') {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'),import('jspdf-autotable')]);
    const doc = new jsPDF({ orientation:'landscape',format:'a4' });
    doc.setFontSize(15); doc.text(`Nova Salud · ${table.title}`,14,15);
    doc.setFontSize(9); const subtitleLines=doc.splitTextToSize(table.subtitle,268);doc.text(subtitleLines,14,23);
    autoTable(doc, { head:[table.columns.map(c=>c.label)], body:table.rows.map(r=>table.columns.map(c=> {
      const value=r[c.key]; return value==null?'No disponible':c.format==='money'&&typeof value==='number'?`S/ ${value.toFixed(2)}`:String(value);
    })), startY:27+subtitleLines.length*4, margin:{left:10,right:10},styles:{fontSize:7,cellPadding:2,overflow:'linebreak'},headStyles:{fillColor:[31,41,55]},
      didDrawPage: data => {doc.setFontSize(8);doc.text(`Página ${data.pageNumber} · Hora de Lima`,10,doc.internal.pageSize.height-6);} });
    return doc.output('blob');
  }
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.default.Workbook(); workbook.creator='Nova Salud';
  const sheet=workbook.addWorksheet('Reporte');
  sheet.addRow([`Nova Salud · ${table.title}`]); sheet.addRow([table.subtitle]);sheet.addRow([]);
  sheet.mergeCells(1,1,1,table.columns.length);sheet.mergeCells(2,1,2,table.columns.length);
  sheet.getRow(1).font={bold:true,size:14};sheet.getRow(2).alignment={wrapText:true};sheet.getRow(2).height=45;
  sheet.addRow(table.columns.map(c=>c.label)); sheet.getRow(4).font={bold:true,color:{argb:'FFFFFFFF'}};
  sheet.getRow(4).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1F2937'}};
  for (const row of table.rows) sheet.addRow(table.columns.map(c=>row[c.key]??'No disponible'));
  sheet.columns.forEach((column,i)=>{column.width=Math.min(48,Math.max(16,table.columns[i].label.length+4));if(table.columns[i].format==='money') column.numFmt='"S/ "#,##0.00';});
  sheet.views=[{state:'frozen',ySplit:4}]; sheet.autoFilter={from:{row:4,column:1},to:{row:4,column:table.columns.length}};
  const buffer=await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
export async function downloadTable(table: ExportTable, format: ExportFormat, filename: string) {
  const blob=await buildTableExport(table,format); const url=URL.createObjectURL(blob); const link=document.createElement('a');
  link.href=url;link.download=`${filename}.${format==='PDF'?'pdf':'xlsx'}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
