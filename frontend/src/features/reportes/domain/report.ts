import type { ExportColumn } from '../../../shared/domain/table-export';
export type ReportType='ventas'|'inventario'|'compras'|'vencimientos';
export type Period='HOY'|'SEMANA'|'MES'|'ANIO';
export type ReportRow=Record<string,string|number|null>;
export interface ReportData {rows:ReportRow[];desde:string;hasta:string}
const iso=(date:Date)=>date.toISOString().slice(0,10);
export function periodRange(period:Period,now=new Date()) {
  const today=now.toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const date=new Date(`${today}T12:00:00Z`);const start=new Date(date);
  if(period==='SEMANA')start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
  if(period==='MES')start.setUTCDate(1);
  if(period==='ANIO'){start.setUTCMonth(0,1);}
  return {desde:iso(start),hasta:today};
}
export const reports:Record<ReportType,{title:string;columns:ExportColumn[];types:string[];note:string}>={
  ventas:{title:'Ventas y facturación',types:['FACTURA','BOLETA','NOTA_VENTA','SIN_COMPROBANTE'],note:'Ventas confirmadas del período. Los pagos fraccionados se muestran juntos; cada venta se cuenta una sola vez.',columns:[{key:'documento',label:'Comprobante'},{key:'fecha',label:'Fecha (Lima)'},{key:'cliente',label:'Cliente'},{key:'unidades',label:'Unidades',format:'number'},{key:'pagos',label:'Métodos de pago'},{key:'impuesto',label:'IGV',format:'money'},{key:'total',label:'Total',format:'money'}]},
  inventario:{title:'Inventario y rotación ABC',types:['A','B','C'],note:'Stock disponible actual. El período se aplica a ventas y rotación ABC (80/15/5 % de ingresos). Valor del stock a precio de venta actual; no representa costo ni utilidad.',columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Producto'},{key:'categoria',label:'Categoría'},{key:'unidades',label:'Unidades vendidas',format:'number'},{key:'ingresos',label:'Ingresos base',format:'money'},{key:'stock',label:'Stock actual',format:'number'},{key:'valor',label:'Valor a precio de venta',format:'money'},{key:'tipo',label:'Clase ABC'}]},
  compras:{title:'Compras y proveedores',types:['PENDIENTE','PARCIAL','RECIBIDA','ANULADA'],note:'Órdenes por fecha de registro. El monto de inversión excluye anuladas y corresponde al costo registrado en la compra.',columns:[{key:'documento',label:'Orden'},{key:'proveedor',label:'Proveedor'},{key:'ruc',label:'RUC'},{key:'fecha',label:'Fecha (Lima)'},{key:'productos',label:'Productos',format:'number'},{key:'total',label:'Costo total',format:'money'},{key:'tipo',label:'Estado'}]},
  vencimientos:{title:'Lotes y vencimientos',types:['VENCIDO','CRITICO','PREVENTIVO','OPTIMO'],note:'El período se aplica a la fecha de vencimiento. Se muestran lotes disponibles con stock de productos activos; días restantes calculados desde hoy en Lima.',columns:[{key:'codigo',label:'Código'},{key:'producto',label:'Producto'},{key:'lote',label:'Lote'},{key:'vencimiento',label:'Vencimiento'},{key:'dias',label:'Días restantes',format:'number'},{key:'unidades',label:'Unidades',format:'number'},{key:'tipo',label:'Riesgo'}]},
};
export function filteredReport(rows:ReportRow[],type:string,query:string){const text=query.trim().toLocaleLowerCase();return rows.filter(row=>(!type||row.tipo===type)&&(!text||Object.values(row).some(v=>String(v??'').toLocaleLowerCase().includes(text))));}
