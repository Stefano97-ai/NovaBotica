package com.novasalud.modules.inicio.repository;
import com.novasalud.modules.inicio.dto.InicioResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
public class InicioRepository {
    private final NamedParameterJdbcTemplate jdbc;private final ObjectMapper json;
    public InicioRepository(NamedParameterJdbcTemplate jdbc,ObjectMapper json){this.jdbc=jdbc;this.json=json;}
    private static final String SQL="""
WITH day AS (SELECT (now() AT TIME ZONE 'America/Lima')::date AS today),
    sales AS (SELECT v.* FROM venta v, day WHERE v.estado='CONFIRMADA'
      AND v.fecha >= day.today AT TIME ZONE 'America/Lima'
      AND v.fecha < (day.today+1) AT TIME ZONE 'America/Lima'
      AND (:role='ADMINISTRADOR' OR (:role='VENDEDOR' AND v.usuario_id=:userId::bigint))),
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
      'sales',CASE WHEN :role='ALMACENERO' THEN NULL ELSE (SELECT json_build_object('count',count(*)::int,'total',COALESCE(sum(total),0)::text) FROM sales) END
    ) AS summary
    """;
    public InicioResponse summary(String id,String role){
        String value=jdbc.queryForObject(SQL,Map.of("userId",Long.parseLong(id),"role",role),String.class);
        try{return json.readValue(value,InicioResponse.class);}catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new IllegalStateException("Respuesta de inicio inválida",e);}
    }
}
