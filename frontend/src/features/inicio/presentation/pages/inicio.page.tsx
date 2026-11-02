import { Button } from '../../../../shared/presentation/ui/button';
import { useCurrentUser } from '../../../auth/presentation/auth-context';
import { useSummary } from '../hooks/useSummary';
import { SummaryMetrics } from '../components/SummaryMetrics';
import { InventoryPanel } from '../components/InventoryPanel';
import { QuickAccess } from '../components/QuickAccess';
import { limaDate, limaTime } from '../../../../shared/presentation/formatters';
import './inicio.css';
export default function InicioPage() {
 const user=useCurrentUser();
 const {data,error,loading,refresh}=useSummary();
 const date=limaDate.format(new Date());
  return <section className="home-page">
    <header className="home-heading"><div><h1>El día en Nova Salud</h1><p>Hola, {user.nombre}. Este es el resumen de tu botica.</p></div><Button className="home-refresh" disabled={loading} onClick={refresh}>{loading?'Actualizando…':'Actualizar'}</Button></header>
    <div className="home-date"><time>{date}</time><span>Hora de Lima</span></div>
    {error&&<p className="home-error" role="alert">{error} {data?'Se muestran los últimos datos recibidos.':''}</p>}
    <div aria-busy={loading}>
    {!data?<div className="home-loading" role="status">{loading?'Consultando ventas e inventario…':'El resumen no está disponible. Usa Actualizar para reintentar.'}</div>:<>
      <SummaryMetrics data={data} user={user}/>
      <div className="home-columns"><InventoryPanel data={data}/><QuickAccess role={user.rol}/></div>
      <p className="home-updated" role="status">Última actualización: {limaTime.format(new Date(data.updatedAt))} · Datos de PostgreSQL</p>
    </>}
    </div>
  </section>;
}
