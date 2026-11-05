import { useId, useState, type ReactNode } from 'react';
import { BarChart3, PieChart, Clock, Layers, AlertTriangle, CalendarClock, RefreshCw } from 'lucide-react';
import type { LoadInicioCharts } from '../../application/inicio-charts-port';
import type { ChartPeriod, DailySale, HourlySale } from '../../domain/inicio-charts';
import { useInicioCharts } from '../use-inicio-charts';

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const integer = new Intl.NumberFormat('es-PE');
const date = (value: string) => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
const hour = (value: number) => `${String(value).padStart(2, '0')}:00`;

function ChartPanel({ title, icon, subtitle, children }: { title: string; icon: ReactNode; subtitle: string; children: ReactNode }) {
  const id = useId();
  return <section className="dash-box analytics-panel" aria-labelledby={id}>
    <h2 id={id} className="dash-box-title">{icon}{title}</h2>
    <p className="analytics-subtitle">{subtitle}</p>
    {children}
  </section>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="analytics-empty">{children}</p>;
}

function DataTable({ headings, rows }: { headings: string[]; rows: (string | number)[][] }) {
  return <details className="analytics-details"><summary>Ver datos del gráfico</summary>
    <div className="analytics-table-scroll"><table>
      <thead><tr>{headings.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table></div>
  </details>;
}

function BarRow({ name, value, max, detail, tone = 'blue' }: { name: string; value: number; max: number; detail: string; tone?: string }) {
  return <div className="analytics-bar-row">
    <div className="analytics-bar-label"><span>{name}</span><strong>{detail}</strong></div>
    <div className="analytics-track" aria-hidden="true"><span className={`analytics-fill analytics-${tone}`} style={{ width: `${max > 0 ? value / max * 100 : 0}%` }} /></div>
  </div>;
}

function Evolution({ rows }: { rows: DailySale[] }) {
  const max = Math.max(1, ...rows.map(r => Number(r.total)));
  const x = (i: number) => 70 + i / Math.max(1, rows.length - 1) * 560;
  const y = (n: number) => 190 - n / max * 150;
  return <>
    <div className="analytics-hour-scroll"><svg className="analytics-svg analytics-evolution-svg" viewBox="0 0 680 235" role="img" aria-label="Importe de ventas confirmadas por día, en soles">
      <title>Evolución diaria de ventas. Los importes exactos están en Ver datos del gráfico.</title>
      {[0, .5, 1].map(t => <g key={t}><line className="chart-grid-line" x1="70" x2="630" y1={y(max * t)} y2={y(max * t)} /><text className="chart-text" x="60" y={y(max * t) + 4} textAnchor="end" fontSize="12">{integer.format(Math.round(max * t))}</text></g>)}
      <text className="chart-text" x="12" y="20" fontSize="12">S/</text>
      <polyline points={rows.map((r, i) => `${x(i)},${y(Number(r.total))}`).join(' ')} fill="none" stroke="var(--analytics-blue)" strokeWidth="3" strokeLinejoin="round" />
      {rows.map((r, i) => <g className="analytics-point" key={r.date} tabIndex={0} role="img" aria-label={`${date(r.date)}: ${money.format(Number(r.total))}, ${r.count} operaciones`}>
        <title>{date(r.date)}: {money.format(Number(r.total))} · {r.count} operaciones</title>
        <circle cx={x(i)} cy={y(Number(r.total))} r="7" fill="transparent" /><circle cx={x(i)} cy={y(Number(r.total))} r="3" fill="var(--analytics-blue)" />
      </g>)}
      {Array.from(new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1])).map(i => rows[i] && <text className="chart-text" key={i} x={x(i)} y="219" textAnchor="middle" fontSize="12">{date(rows[i].date)}</text>)}
    </svg></div>
    <DataTable headings={['Fecha', 'Operaciones', 'Ventas']} rows={rows.map(r => [date(r.date), r.count, money.format(Number(r.total))])} />
  </>;
}

function Hourly({ rows }: { rows: HourlySale[] }) {
  const max = Math.max(2, Math.ceil(Math.max(0, ...rows.map(r => r.count)) / 2) * 2);
  return <>
    <div className="analytics-hour-scroll"><svg className="analytics-svg analytics-hour-svg" viewBox="0 0 680 235" role="img" aria-label="Cantidad de ventas por hora de Lima">
      <title>Operaciones confirmadas por hora. Consulta los valores exactos en Ver datos del gráfico.</title>
      {[0, .5, 1].map(t => <g key={t}><line className="chart-grid-line" x1="40" x2="665" y1={190 - t * 150} y2={190 - t * 150} /><text className="chart-text" x="30" y={194 - t * 150} textAnchor="end" fontSize="12">{Number((max * t).toFixed(1))}</text></g>)}
      {rows.map(r => <g className="analytics-point" key={r.hour} tabIndex={0} role="img" aria-label={`${hour(r.hour)}: ${r.count} operaciones, ${money.format(Number(r.total))}`}>
        <title>{hour(r.hour)} · {r.count} operaciones · {money.format(Number(r.total))}</title>
        <rect x={45 + r.hour * 26} y={190 - r.count / max * 150} width="17" height={r.count / max * 150} rx="3" fill="var(--analytics-blue)" />
        <rect x={43 + r.hour * 26} y="35" width="21" height="160" fill="transparent" />
        {r.hour % 3 === 0 && <text className="chart-text" x={53 + r.hour * 26} y="219" textAnchor="middle" fontSize="12">{hour(r.hour)}</text>}
      </g>)}
    </svg></div>
    <DataTable headings={['Hora de Lima', 'Operaciones', 'Ventas']} rows={rows.map(r => [hour(r.hour), r.count, money.format(Number(r.total))])} />
  </>;
}

export function InicioCharts({ load, version, onUnauthorized, canViewSales }: { load: LoadInicioCharts; version: number; onUnauthorized: () => void; canViewSales: boolean }) {
  const [days, setDays] = useState<ChartPeriod>(30);
  const [retry, setRetry] = useState(0);
  const { data, loading, error } = useInicioCharts(load, days, version + retry, onUnauthorized);
  // A failed period change must never relabel the previous result as the requested period.
  const current = data?.days === days ? data : null;
  const sales = current?.sales;
  const hasSales = sales?.evolution.some(r => r.count > 0);
  const initialState = !current ? <Empty>{loading ? 'Cargando datos…' : 'No se pudieron cargar los datos.'}</Empty> : null;
  const salesState = initialState ?? (!sales ? <Empty>Los datos de ventas no están disponibles para tu rol.</Empty> : !hasSales ? <Empty>No hay ventas confirmadas en este período.</Empty> : null);
  const periodLabel = current ? `${date(current.from)} – ${date(current.to)} · Hora de Lima` : 'Hora de Lima';
  const stockMax = Math.max(1, ...(current?.criticalStock ?? []).map(r => Math.max(r.available, r.minimum)));
  return <div className="inicio-analytics" aria-busy={loading}>
    <div className="analytics-toolbar">
      <p>{canViewSales ? periodLabel : 'Inventario actual'}{loading && current ? ' · Actualizando…' : ''}</p>
      <div>{canViewSales && <label>Período de ventas <select value={days} onChange={e => setDays(Number(e.target.value) as ChartPeriod)}>
        <option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option>
      </select></label>}</div>
    </div>
    {error && <div className="dash-error" role="alert"><span>No pudimos actualizar los gráficos.{current ? ' Se conservan los últimos datos cargados.' : ''}</span><button type="button" className="period-btn" onClick={() => setRetry(v => v + 1)}><RefreshCw size={13} />Reintentar</button></div>}
    <div className="analytics-grid">
      {canViewSales && <>
        <ChartPanel title="Evolución de ventas" icon={<BarChart3 size={15} />} subtitle="Importe diario · Incluye días sin operaciones">
          {salesState ?? <Evolution rows={sales!.evolution} />}
        </ChartPanel>
        <ChartPanel title="Top 5 productos más vendidos" icon={<PieChart size={15} />} subtitle="Ordenados por unidades vendidas en el período">
          {salesState ?? (!sales!.topProducts.length ? <Empty>No hay detalles de productos para las ventas del período.</Empty> : <><div className="analytics-bars">{sales!.topProducts.map(r => <BarRow key={r.id} name={r.name} value={r.units} max={Math.max(1, ...sales!.topProducts.map(p => p.units))} detail={`${integer.format(r.units)} uds.`} />)}</div><DataTable headings={['Producto', 'Unidades', 'Ventas']} rows={sales!.topProducts.map(r => [r.name, r.units, money.format(Number(r.total))])} /></>)}
        </ChartPanel>
        <ChartPanel title="Ventas por hora" icon={<Clock size={15} />} subtitle="Número de operaciones por hora · Acumulado del período">
          {salesState ?? <Hourly rows={sales!.byHour} />}
        </ChartPanel>
        <ChartPanel title="Ventas por categoría" icon={<Layers size={15} />} subtitle="Importes con impuestos · Categoría actual del producto">
          {salesState ?? (!sales!.byCategory.length ? <Empty>No hay detalles de categorías para las ventas del período.</Empty> : <><div className="analytics-bars analytics-category-bars">{sales!.byCategory.map(r => <BarRow key={r.id} name={r.name} value={Number(r.total)} max={Math.max(1, ...sales!.byCategory.map(c => Number(c.total)))} detail={money.format(Number(r.total))} tone="violet" />)}</div><DataTable headings={['Categoría', 'Unidades', 'Ventas']} rows={sales!.byCategory.map(r => [r.name, r.units, money.format(Number(r.total))])} /></>)}
        </ChartPanel>
      </>}
      <ChartPanel title="Productos con stock crítico" icon={<AlertTriangle size={15} />} subtitle="Hasta 5 productos · Ordenados por unidades faltantes para alcanzar el mínimo">
        {initialState ?? (current!.criticalStock.length ? <>
          <p className="analytics-legend"><span className="stock-legend-available" />Disponible <span className="stock-legend-minimum" />Mínimo</p>
          <div className="analytics-bars">{current!.criticalStock.map(r => <div className="analytics-bar-row" key={r.id}>
            <div className="analytics-bar-label"><span>{r.name}</span><strong>{r.available} / {r.minimum} uds.</strong></div>
            <div className="analytics-track analytics-stock-track" aria-hidden="true"><span className="analytics-fill analytics-orange" style={{ width: `${r.available / stockMax * 100}%` }} /><span className="analytics-minimum" style={{ left: `${r.minimum / stockMax * 100}%` }} /></div>
            <span className="analytics-row-note">{r.shortage > 0 ? `Faltan ${integer.format(r.shortage)} unidades para el mínimo` : r.available === 0 ? 'Sin existencias · Mínimo configurado en 0' : 'En el mínimo configurado'}</span>
          </div>)}</div>
          <DataTable headings={['Producto', 'Disponible', 'Mínimo', 'Faltante']} rows={current!.criticalStock.map(r => [r.name, r.available, r.minimum, r.shortage])} />
        </> : <Empty>No hay productos activos con stock en el mínimo o por debajo.</Empty>)}
      </ChartPanel>
      <ChartPanel title="Vencimientos próximos" icon={<CalendarClock size={15} />} subtitle="Unidades disponibles en lotes de productos activos · Desde hoy, sin lotes vencidos">
        {initialState ?? (current!.expirations.some(r => r.units > 0) ? <>
          <div className="analytics-bars">{current!.expirations.map((r, i) => <div key={r.label}><BarRow name={r.label} value={r.units} max={Math.max(1, ...current!.expirations.map(b => b.units))} detail={`${integer.format(r.units)} uds.`} tone={['rose', 'orange', 'blue'][i]} /><span className="analytics-row-note">{integer.format(r.lots)} lotes con existencias</span></div>)}</div>
          <DataTable headings={['Vence en', 'Lotes', 'Unidades']} rows={current!.expirations.map(r => [r.label, r.lots, r.units])} />
        </> : <Empty>No hay existencias disponibles que venzan en los próximos 90 días.</Empty>)}
      </ChartPanel>
    </div>
  </div>;
}
