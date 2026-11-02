import { Card } from '../../../../shared/presentation/ui/card';
import { Link } from 'react-router-dom';
import type { Summary } from '../../domain/summary';
import { lotDate } from '../../../../shared/presentation/formatters';
export function InventoryPanel({data}:{data:Summary}) { return (<Card className="home-panel"><div className="home-section-title"><h2>Atención al inventario</h2><Link to="/inventario">Ver módulo</Link></div>
        <div className="home-alert-row"><span>Productos por reponer</span><strong>{data.lowStock}</strong></div><div className="home-alert-row"><span>Lotes vencidos con existencias</span><strong>{data.expired}</strong></div>
        <p className="home-note">El stock vendible excluye lotes vencidos y no disponibles.</p>
        <h3>Vencimientos en los próximos 30 días</h3>
        {data.expiring.length?<ul className="home-lots">{data.expiring.map(lot=><li key={lot.id}><div><strong>{lot.producto}</strong><span>Lote {lot.lote} · {lot.unidades} unidades</span></div><time dateTime={lot.vencimiento}>{lotDate(lot.vencimiento)}</time></li>)}</ul>:<div className="home-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-11 5 2 2 4-4"/></svg><strong>{data.products?'Sin vencimientos próximos':'Tu inventario empieza aquí'}</strong><p>{data.products?'No hay lotes disponibles con stock que venzan en los próximos 30 días.':'Todavía no hay productos activos. Las alertas aparecerán cuando se registren productos y lotes.'}</p></div>}
        {data.expiringCount>5&&<p className="home-note">Se muestran los 5 lotes más próximos a vencer.</p>}
      </Card>); }
