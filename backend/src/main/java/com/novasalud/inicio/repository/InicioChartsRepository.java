package com.novasalud.inicio.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novasalud.inicio.dto.InicioChartsDto;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class InicioChartsRepository {
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper json;

    public InicioChartsRepository(NamedParameterJdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    // One statement gives every series the same snapshot and applies sales visibility before aggregation.
    private static final String SQL = """
        WITH period AS (
          SELECT (now() AT TIME ZONE 'America/Lima')::date AS today,
                 (now() AT TIME ZONE 'America/Lima')::date - (:days::int - 1) AS start
        ), sales AS (
          SELECT v.* FROM venta v, period p
          WHERE v.estado='CONFIRMADA'
            AND v.fecha >= p.start AT TIME ZONE 'America/Lima'
            AND v.fecha < (p.today+1) AT TIME ZONE 'America/Lima'
            AND (:role='ADMINISTRADOR' OR (:role='VENDEDOR' AND v.usuario_id=:userId::bigint))
        ), daily AS (
          SELECT (fecha AT TIME ZONE 'America/Lima')::date AS day, count(*) AS count, sum(total) AS total
          FROM sales GROUP BY 1
        ), evolution AS (
          SELECT (p.start+n)::text AS date, COALESCE(d.count,0) AS count, COALESCE(d.total,0)::text AS total
          FROM period p CROSS JOIN generate_series(0,:days::int-1) n
          LEFT JOIN daily d ON d.day=p.start+n ORDER BY n
        ), top_products AS (
          SELECT p.id::text AS id, p.nombre AS name, sum(d.cantidad) AS units, sum(d.total)::text AS total
          FROM sales s JOIN detalle_venta d ON d.venta_id=s.id JOIN producto p ON p.id=d.producto_id
          GROUP BY p.id,p.nombre ORDER BY sum(d.cantidad) DESC,sum(d.total) DESC,p.id LIMIT 5
        ), hourly_totals AS (
          SELECT extract(hour FROM fecha AT TIME ZONE 'America/Lima')::int AS hour,
                 count(*) AS count, sum(total) AS total FROM sales GROUP BY 1
        ), hourly AS (
          SELECT n AS hour, COALESCE(h.count,0) AS count, COALESCE(h.total,0)::text AS total
          FROM generate_series(0,23) n LEFT JOIN hourly_totals h ON h.hour=n ORDER BY n
        ), categories AS (
          SELECT c.id::text AS id, c.nombre AS name, sum(d.cantidad) AS units, sum(d.total)::text AS total
          FROM sales s JOIN detalle_venta d ON d.venta_id=s.id
          JOIN producto p ON p.id=d.producto_id JOIN categoria c ON c.id=p.categoria_id
          GROUP BY c.id,c.nombre ORDER BY sum(d.total) DESC,c.id
        ), critical AS (
          SELECT p.id::text AS id,p.nombre AS name,s.cantidad AS available,p.stock_minimo AS minimum,
                 p.stock_minimo-s.cantidad AS shortage
          FROM stock_disponible s JOIN producto p ON p.id=s.producto_id
          WHERE p.activo AND s.cantidad<=p.stock_minimo
          ORDER BY shortage DESC,s.cantidad,p.id LIMIT 5
        ), buckets(label,low,high) AS (
          VALUES ('0–30 días',0,30),('31–60 días',31,60),('61–90 días',61,90)
        ), expirations AS (
          SELECT b.label,count(l.id) AS lots,COALESCE(sum(l.stock_actual),0) AS units
          FROM buckets b CROSS JOIN period p
          LEFT JOIN lote l ON l.fecha_vencimiento BETWEEN p.today+b.low AND p.today+b.high
            AND l.disponible AND l.stock_actual>0
            AND EXISTS (SELECT 1 FROM producto pr WHERE pr.id=l.producto_id AND pr.activo)
          GROUP BY b.label,b.low ORDER BY b.low
        )
        SELECT json_build_object(
          'from',p.start::text,'to',p.today::text,'days',:days::int,
          'sales',CASE WHEN :role='ALMACENERO' THEN NULL ELSE json_build_object(
            'evolution',(SELECT json_agg(e) FROM evolution e),
            'topProducts',COALESCE((SELECT json_agg(t) FROM top_products t),'[]'::json),
            'byHour',(SELECT json_agg(h) FROM hourly h),
            'byCategory',COALESCE((SELECT json_agg(c) FROM categories c),'[]'::json)) END,
          'criticalStock',COALESCE((SELECT json_agg(c) FROM critical c),'[]'::json),
          'expirations',(SELECT json_agg(e) FROM expirations e))::text FROM period p
        """;

    public InicioChartsDto charts(String userId, String role, int days) {
        String value = jdbc.queryForObject(SQL,
            Map.of("userId", Long.parseLong(userId), "role", role, "days", days), String.class);
        try {
            return json.readValue(value, InicioChartsDto.class);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Respuesta de gráficos inválida", e);
        }
    }
}
