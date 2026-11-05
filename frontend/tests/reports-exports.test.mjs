import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';
import {periodRange,filteredReport} from '../src/features/reportes/domain/report.ts';
import {buildTableExport} from '../src/shared/infrastructure/table-export.ts';

test('quick periods use Lima today, Monday week start, month and year boundaries',()=>{
  const now=new Date('2027-01-01T03:00:00Z');
  assert.deepEqual(periodRange('HOY',now),{desde:'2026-12-31',hasta:'2026-12-31'});
  assert.deepEqual(periodRange('SEMANA',now),{desde:'2026-12-28',hasta:'2026-12-31'});
  assert.deepEqual(periodRange('MES',now),{desde:'2026-12-01',hasta:'2026-12-31'});
  assert.deepEqual(periodRange('ANIO',now),{desde:'2026-01-01',hasta:'2026-12-31'});
});
test('type and text filters export the same subset shown by the report',()=>{
  const rows=[{tipo:'FACTURA',documento:'F001',total:10},{tipo:'BOLETA',documento:'B001',total:5}];
  assert.deepEqual(filteredReport(rows,'FACTURA',' f001 '),[rows[0]]);
  assert.deepEqual(filteredReport(rows,'BOLETA','F001'),[]);
});
test('PDF and XLSX are valid documents with full rows, numeric amounts and literal text',async()=>{
  const table={title:'Prueba de exportación',subtitle:'Período 2026-11-01 al 2026-11-05 · Datos de prueba',columns:[{key:'nombre',label:'Producto'},{key:'total',label:'Total',format:'money'}],rows:Array.from({length:90},(_,i)=>({nombre:i===0?'=SUM(1,2)':`Producto médico ${i}`,total:i+0.5}))};
  const pdf=await buildTableExport(table,'PDF');const bytes=new Uint8Array(await pdf.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0,5)),'%PDF-');
  const xlsx=await buildTableExport(table,'EXCEL');const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await xlsx.arrayBuffer());
  const sheet=workbook.getWorksheet('Reporte');assert.equal(sheet.rowCount,94);assert.equal(sheet.getCell('A5').value,'=SUM(1,2)');assert.equal(sheet.getCell('B94').value,89.5);
  await fs.mkdir('.local',{recursive:true});await fs.writeFile('.local/export-sample.pdf',bytes);await fs.writeFile('.local/export-sample.xlsx',new Uint8Array(await xlsx.arrayBuffer()));
});
