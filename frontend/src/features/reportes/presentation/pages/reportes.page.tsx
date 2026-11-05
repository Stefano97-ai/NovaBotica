import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {BarChart3,TrendingUp,Package,Truck,AlertTriangle,FileText,Receipt,DollarSign,RefreshCw} from 'lucide-react';
import {ExportButtons} from '../../../../shared/presentation/export-buttons';
import type {ExportFormat,ExportTable} from '../../../../shared/domain/table-export';
import type {ReportSource} from '../../application/report-source';
import {filteredReport,periodRange,reports,type Period,type ReportData,type ReportRow,type ReportType} from '../../domain/report';
import '../../pages/reportes.css';
import './reportes-live.css';

const money=(n:number)=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(n);
export function ReportesView({source,exportTable}:{source:ReportSource;exportTable:(table:ExportTable,format:ExportFormat,name:string)=>Promise<void>}) {
  const [tab,setTab]=useState<ReportType>('ventas');
  const [range,setRange]=useState(()=>periodRange('MES'));
  const [period,setPeriod]=useState<Period|null>('MES');
  const [type,setType]=useState('');const [search,setSearch]=useState('');const [page,setPage]=useState(0);
  const [result,setResult]=useState<{key:string;data:ReportData}|null>(null);const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [retry,setRetry]=useState(0);
  const key=JSON.stringify([tab,range]);const current=result?.key===key?result.data:null;
  const config=reports[tab];const rows=useMemo(()=>filteredReport(current?.rows??[],type,search),[current,type,search]);
  useEffect(()=>{const controller=new AbortController();let active=true;const timer=setTimeout(()=>controller.abort(),25000);
    setLoading(true);setError('');
    if(!range.desde||!range.hasta||range.desde>range.hasta){setError('Indica un rango válido: desde no puede superar hasta.');setLoading(false);clearTimeout(timer);return;}
    source.load(tab,range.desde,range.hasta,controller.signal).then(data=>{if(active)setResult({key,data});})
      .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'No se pudo cargar el reporte.');})
      .finally(()=>{clearTimeout(timer);if(active)setLoading(false);});
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[source,key,retry]);
  useEffect(()=>setPage(0),[key,type,search]);
  useEffect(()=>{if(page>0&&page*25>=rows.length)setPage(Math.max(0,Math.ceil(rows.length/25)-1));},[rows.length,page]);
  async function download(format:ExportFormat){setBusy(true);setError('');try{await exportTable({title:config.title,subtitle:`Período ${range.desde} al ${range.hasta} · ${rows.length} registros · ${config.note}`,columns:config.columns,rows},format,`nova-${tab}-${range.desde}-${range.hasta}`);}catch(reason){setError(reason instanceof Error?reason.message:'No se pudo exportar.');}finally{setBusy(false);}}
  const sum=(field:string,data:ReportRow[]=rows)=>data.reduce((total,row)=>total+Number(row[field]??0),0);
  const summaries=tab==='ventas'?[['Total facturado',money(sum('total'))],['Operaciones',rows.length],['Unidades vendidas',sum('unidades')],['IGV',money(sum('impuesto'))]]:
    tab==='compras'?[['Costo registrado',money(sum('total',rows.filter(r=>r.tipo!=='ANULADA')))],['Órdenes',rows.length],['Recibidas',rows.filter(r=>r.tipo==='RECIBIDA').length],['Pendientes / parciales',rows.filter(r=>r.tipo==='PENDIENTE'||r.tipo==='PARCIAL').length]]:
    tab==='inventario'?[['Productos',rows.length],['Stock disponible actual',sum('stock')],['Unidades vendidas',sum('unidades')],['Valor a precio de venta',money(sum('valor'))]]:
    [['Lotes',rows.length],['Unidades',sum('unidades')],['Vencidos',rows.filter(r=>r.tipo==='VENCIDO').length],['Críticos',rows.filter(r=>r.tipo==='CRITICO').length]];
  const daily=Object.entries(rows.reduce<Record<string,number>>((acc,row)=>{if(row.dia)acc[String(row.dia)]=(acc[String(row.dia)]??0)+Number(row.total);return acc;},{})).sort(([a],[b])=>a.localeCompare(b));
  const maximum=Math.max(1,...daily.map(([,value])=>value));
  return <div className="rep-page rep-live"><div className="rep-bar"><h1 className="rep-bar-title"><BarChart3 size={15}/>REPORTES Y ESTADÍSTICAS</h1><div className="rep-actions"><Link className="rep-dash-btn" to="/ventas?tipo=FACTURA"><FileText size={12}/>EMITIR FACTURA</Link><Link className="rep-dash-btn" to="/ventas?tipo=BOLETA"><Receipt size={12}/>EMITIR BOLETA</Link></div></div>
    <div className="rep-tabs-bar">{([{id:'ventas',label:'Ventas y facturación',Icon:TrendingUp},{id:'inventario',label:'Inventario y rotación ABC',Icon:Package},{id:'compras',label:'Compras y proveedores',Icon:Truck},{id:'vencimientos',label:'Lotes y vencimientos',Icon:AlertTriangle}] as const).map(({id,label,Icon})=><button type="button" key={id} className={`rep-tab-btn ${tab===id?'is-active':''}`} onClick={()=>{setTab(id);setType('');setSearch('');}}><Icon size={15}/>{label}</button>)}</div>
    <section className="rep-card" aria-labelledby="report-title"><div className="rep-card-header"><h2 className="rep-card-title" id="report-title">{config.title}</h2><div className="rep-quick-dates"><span>Período:</span>{(['HOY','SEMANA','MES','ANIO'] as const).map((id,i)=><button type="button" key={id} aria-pressed={period===id} className={`rep-quick-btn ${period===id?'active':''}`} onClick={()=>{setPeriod(id);setRange(periodRange(id));}}>{['Hoy','Semana','Este mes','Año'][i]}</button>)}</div></div>
      <div className="rep-kpi-ribbon">{summaries.map(([label,value],i)=><div className="rep-kpi-card" key={label}><div className={`rep-kpi-icon ${['ventas','compras','stock','vencimiento'][i]}`}><DollarSign size={22}/></div><div className="rep-kpi-info"><span className="rep-kpi-val">{current?value:'—'}</span><span className="rep-kpi-label">{label}</span><span className="rep-kpi-sub">Según filtros seleccionados</span></div></div>)}</div>
      <p className="rep-live-note">{config.note}</p>
      <div className="rep-filters-box"><div className="rep-filters-row"><label>Desde<input type="date" value={range.desde} onChange={e=>{setPeriod(null);setRange(r=>({...r,desde:e.target.value}));}}/></label><label>Hasta<input type="date" value={range.hasta} onChange={e=>{setPeriod(null);setRange(r=>({...r,hasta:e.target.value}));}}/></label>
        <label>Tipo / estado<select value={type} onChange={e=>setType(e.target.value)}><option value="">Todos</option>{config.types.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
        <label className="rep-live-search">Buscar<input placeholder="Documento, producto, cliente o proveedor" value={search} onChange={e=>setSearch(e.target.value)}/></label><button type="button" className="rep-quick-btn" onClick={()=>setRetry(n=>n+1)} disabled={loading}><RefreshCw size={15}/>Actualizar</button></div></div>
      {error&&<p className="rep-live-error" role="alert">{error}{current&&' Se conservan los últimos datos de esta consulta.'}</p>}
      <ExportButtons busy={busy} disabled={loading||!current||!rows.length} onExport={format=>void download(format)}/>
      {tab==='ventas'&&current&&daily.length>0&&<div className="rep-chart-card"><h3 className="rep-chart-title">Evolución de ventas del período</h3><div className="rep-live-chart">{daily.map(([day,value])=><div key={day} className="rep-live-chart-row"><span>{day}</span><div><i style={{width:`${value/maximum*100}%`}}/></div><strong>{money(value)}</strong></div>)}</div></div>}
      <p role="status" className="rep-live-note">{loading?'Consultando datos reales…':`${rows.length} registros encontrados · Hora de Lima`}</p>
      <div className="rep-table-wrap" aria-busy={loading}><table className="rep-table"><thead><tr>{config.columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{rows.slice(page*25,(page+1)*25).map(row=><tr key={String(row.id)}>{config.columns.map(c=><td key={c.key}>{row[c.key]==null?'No disponible':c.format==='money'?money(Number(row[c.key])):String(row[c.key])}</td>)}</tr>)}{!rows.length&&<tr><td colSpan={config.columns.length}>{loading?'Cargando…':'No hay registros para los filtros seleccionados.'}</td></tr>}</tbody></table></div>
      <nav className="rep-live-pagination" aria-label="Paginación de reportes"><span>{rows.length?`${page*25+1}–${Math.min((page+1)*25,rows.length)} de ${rows.length}`:'0 registros'}</span><button type="button" className="rep-quick-btn" disabled={page===0||loading} onClick={()=>setPage(n=>n-1)}>Anterior</button><button type="button" className="rep-quick-btn" disabled={(page+1)*25>=rows.length||loading} onClick={()=>setPage(n=>n+1)}>Siguiente</button></nav>
    </section></div>;
}
