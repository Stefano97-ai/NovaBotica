import type { Summary } from '../../domain/summary';
import type { User } from '../../../../shared/domain/user';
import { money } from '../../../../shared/presentation/formatters';
export function SummaryMetrics({data,user}:{data:Summary;user:User}) { return (<dl className="home-metrics">
        {data.sales&&<div><dt>{user.rol==='VENDEDOR'?'Mis ventas de hoy':'Ventas de hoy'}</dt><dd>{money.format(Number(data.sales.total))}</dd><small>{data.sales.count} operaciones confirmadas</small></div>}
        <div><dt>Productos activos</dt><dd>{data.products}</dd><small>Registrados en el catálogo</small></div>
        <div><dt>Stock por reponer</dt><dd>{data.lowStock}</dd><small>Productos en el mínimo o por debajo</small></div>
        <div><dt>Próximos a vencer</dt><dd>{data.expiringCount}</dd><small>Lotes con stock · próximos 30 días</small></div>
      </dl>); }
