import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
@Injectable()
export class InicioRepository {
  constructor(private readonly db: DatabaseService) {}
  async summary(userId: string, role: string) {
    // One statement gives every section the same PostgreSQL snapshot.
    const result = await this.db.query(`WITH day AS (SELECT (now() AT TIME ZONE 'America/Lima')::date AS today),
    sales AS (SELECT v.* FROM venta v, day WHERE v.estado='CONFIRMADA'
      AND v.fecha >= day.today AT TIME ZONE 'America/Lima'
      AND v.fecha < (day.today+1) AT TIME ZONE 'America/Lima'
      AND ($2='ADMINISTRADOR' OR ($2='VENDEDOR' AND v.usuario_id=$1::bigint))),
    expiring AS (SELECT l.id::text, p.nombre AS producto, l.numero_lote AS lote,
      l.fecha_vencimiento::text AS vencimiento, l.stock_actual AS unidades
      FROM lote l JOIN producto p ON p.id=l.producto_id, day
      WHERE p.activo AND l.disponible AND l.stock_actual>0 AND l.fecha_vencimiento BETWEEN day.today AND day.today+30)
    SELECT json_build_object(
      'updatedAt',now(),'products',(SELECT count(*)::int FROM producto WHERE activo),
      'lowStock',(SELECT count(*)::int FROM stock_disponible s JOIN producto p ON p.id=s.producto_id WHERE s.cantidad<=p.stock_minimo),
      'expired',(SELECT count(*)::int FROM lote l JOIN producto p ON p.id=l.producto_id, day WHERE p.activo AND l.stock_actual>0 AND l.disponible AND l.fecha_vencimiento<day.today),
      'expiringCount',(SELECT count(*)::int FROM expiring),
      'expiring',COALESCE((SELECT json_agg(e) FROM (SELECT * FROM expiring ORDER BY vencimiento,id LIMIT 5) e),'[]'::json),
      'sales',CASE WHEN $2='ALMACENERO' THEN NULL ELSE (SELECT json_build_object('count',count(*)::int,'total',COALESCE(sum(total),0)::text) FROM sales) END
    ) AS summary`,[userId,role]);
    return result.rows[0].summary;
  }
}
