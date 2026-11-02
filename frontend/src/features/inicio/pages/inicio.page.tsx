import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import type { User } from '../../auth/api/auth';
import './inicio.css';
interface Summary {updatedAt:string;products:number;lowStock:number;expired:number;expiringCount:number;expiring:{id:string;producto:string;lote:string;vencimiento:string;unidades:number}[];sales:{count:number;total:string}|null}
const money=new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'});
export default function Page() {
  const user=useOutletContext<User>();
  const navigate=useNavigate();
  const [data,setData]=useState<Summary|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [version,setVersion]=useState(0);
  useEffect(()=>{
    const controller=new AbortController(); let active=true;
    setLoading(true);setError('');
    const timer=setTimeout(()=>controller.abort(),15000);
    fetch('/api/inicio',{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async response=>{
      if(response.status===401){navigate('/login',{replace:true});return;}
      if(!response.ok)throw new Error();
      const summary:Summary=await response.json();if(active)setData(summary);
    }).catch(()=>{if(active)setError('No pudimos actualizar el resumen. Comprueba tu conexión y vuelve a intentarlo.');})
    .finally(()=>{clearTimeout(timer);if(active)setLoading(false);});
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[version,navigate]);
  const date=new Intl.DateTimeFormat('es-PE',{dateStyle:'full',timeZone:'America/Lima'}).format(new Date());
  const links=[{to:'/productos',name:'Productos',detail:'Catálogo y precios'}, {to:'/inventario',name:'Inventario',detail:'Existencias y lotes'},
    ...(user.rol!=='ALMACENERO'?[{to:'/ventas',name:'Ventas',detail:'Atención y cobros'}]:[]),
    ...(user.rol!=='VENDEDOR'?[{to:'/compras',name:'Compras',detail:'Abastecimiento'}]:[])];
  return <section className="home-page">
    <header className="home-heading"><div><h1>El día en Nova Salud</h1><p>Hola, {user.nombre}. Este es el resumen de tu botica.</p></div><button className="home-refresh" disabled={loading} onClick={()=>setVersion(v=>v+1)}>{loading?'Actualizando…':'Actualizar'}</button></header>
    <div className="home-date"><time>{date}</time><span>Hora de Lima</span></div>
    {error&&<p className="home-error" role="alert">{error} {data?'Se muestran los últimos datos recibidos.':''}</p>}
    <div aria-busy={loading}>
    {!data?<div className="home-loading" role="status">{loading?'Consultando ventas e inventario…':'El resumen no está disponible. Usa Actualizar para reintentar.'}</div>:<>
      <dl className="home-metrics">
        {data.sales&&<div><dt>{user.rol==='VENDEDOR'?'Mis ventas de hoy':'Ventas de hoy'}</dt><dd>{money.format(Number(data.sales.total))}</dd><small>{data.sales.count} operaciones confirmadas</small></div>}
        <div><dt>Productos activos</dt><dd>{data.products}</dd><small>Registrados en el catálogo</small></div>
        <div><dt>Stock por reponer</dt><dd>{data.lowStock}</dd><small>Productos en el mínimo o por debajo</small></div>
        <div><dt>Próximos a vencer</dt><dd>{data.expiringCount}</dd><small>Lotes con stock · próximos 30 días</small></div>
      </dl>
      <div className="home-columns"><section className="home-panel"><div className="home-section-title"><h2>Atención al inventario</h2><Link to="/inventario">Ver módulo</Link></div>
        <div className="home-alert-row"><span>Productos por reponer</span><strong>{data.lowStock}</strong></div><div className="home-alert-row"><span>Lotes vencidos con existencias</span><strong>{data.expired}</strong></div>
        <p className="home-note">El stock vendible excluye lotes vencidos y no disponibles.</p>
        <h3>Vencimientos en los próximos 30 días</h3>
        {data.expiring.length?<ul className="home-lots">{data.expiring.map(lot=><li key={lot.id}><div><strong>{lot.producto}</strong><span>Lote {lot.lote} · {lot.unidades} unidades</span></div><time dateTime={lot.vencimiento}>{new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(lot.vencimiento+'T12:00:00Z'))}</time></li>)}</ul>:<div className="home-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-11 5 2 2 4-4"/></svg><strong>{data.products?'Sin vencimientos próximos':'Tu inventario empieza aquí'}</strong><p>{data.products?'No hay lotes disponibles con stock que venzan en los próximos 30 días.':'Todavía no hay productos activos. Las alertas aparecerán cuando se registren productos y lotes.'}</p></div>}
        {data.expiringCount>5&&<p className="home-note">Se muestran los 5 lotes más próximos a vencer.</p>}
      </section><section className="home-panel home-access"><h2>Tus módulos</h2><p className="home-note">Accesos disponibles para tu rol.</p>{links.map(link=><Link key={link.to} to={link.to}><span><strong>{link.name}</strong><small>{link.detail}</small></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></Link>)}<p className="home-development">En preparación: estos módulos aún no permiten registrar operaciones.</p></section></div>
      <p className="home-updated" role="status">Última actualización: {new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit',timeZone:'America/Lima'}).format(new Date(data.updatedAt))} · Datos de PostgreSQL</p>
    </>}
    </div>
  </section>;
}
