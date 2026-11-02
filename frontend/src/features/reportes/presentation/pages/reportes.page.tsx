import { Button } from '../../../../shared/presentation/ui/button';
import { useSummary } from '../../../inicio/presentation/hooks/useSummary';
import { money, limaDate, limaTime } from '../../../../shared/presentation/formatters';
import '../../../../shared/presentation/components/modules.css';
export default function ReportesPage() {
  const { data, loading, error, refresh } = useSummary();
  return <section className="module-page">
    <header className="module-heading"><div><h1>Reportes</h1><p>Resumen operativo con los datos disponibles de tu botica.</p></div><Button onClick={refresh} disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar'}</Button></header>
    <p className="module-scope"><strong>Datos del servidor</strong> · Ventas del día en Lima y situación actual del inventario. Los borradores no se incluyen.</p>
    {error && <p role="alert" className="module-error">{error}</p>}
    {loading && !data && <p role="status">Consultando el resumen…</p>}
    {data && <><p className="module-explanation">Última lectura: {limaDate.format(new Date(data.updatedAt))}, {limaTime.format(new Date(data.updatedAt))}.</p>
      <div className="module-report">
        <article><h2>Ventas de hoy</h2><strong>{data.sales ? money.format(Number(data.sales.total)) : '—'}</strong><p>{data.sales ? data.sales.count + ' operaciones confirmadas.' : 'Información no disponible para esta sesión.'}</p></article>
        <article><h2>Catálogo activo</h2><strong>{data.products}</strong><p>Productos activos registrados en el servidor.</p></article>
        <article><h2>Reposición</h2><strong>{data.lowStock}</strong><p>Productos con stock vendible en el mínimo o por debajo.</p></article>
        <article><h2>Vencimientos</h2><strong>{data.expiringCount}</strong><p>Lotes con existencias que vencen en los próximos 30 días. Lotes vencidos con existencias: {data.expired}.</p></article>
      </div><p className="module-scope">Los informes históricos, márgenes y filtros por periodo estarán disponibles cuando existan sus consultas en el servidor.</p></>}
  </section>;
}
