package com.novasalud.reportes.service;

import com.novasalud.shared.exception.BadRequestException;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReporteDetalleService {
    private final NamedParameterJdbcTemplate jdbc;
    public ReporteDetalleService(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}
    @Transactional(readOnly=true)
    public Map<String,Object> detalle(String tipo,LocalDate desde,LocalDate hasta) {
        var zone=ZoneId.of("America/Lima");var today=LocalDate.now(zone);
        if(desde==null) desde=today.withDayOfMonth(1);if(hasta==null) hasta=today;
        if(desde.isAfter(hasta)) throw new BadRequestException("La fecha inicial no puede superar la final.");
        var params=Map.of("desde",Timestamp.from(desde.atStartOfDay(zone).toInstant()),"hasta",Timestamp.from(hasta.plusDays(1).atStartOfDay(zone).toInstant()),"fechaDesde",desde,"fechaHasta",hasta);
        String sql=switch(tipo) {
            case "ventas" -> """
              SELECT v.id,COALESCE(sc.serie||'-'||c.correlativo::text,'Venta #'||v.id) AS documento,
                COALESCE(tc.codigo,'SIN_COMPROBANTE') AS tipo,to_char(v.fecha AT TIME ZONE 'America/Lima','DD/MM/YYYY HH24:MI') AS fecha,
                to_char(v.fecha AT TIME ZONE 'America/Lima','YYYY-MM-DD') AS dia,
                COALESCE(cl.nombre,'Cliente varios') AS cliente,v.total,v.impuesto,
                COALESCE((SELECT sum(d.cantidad) FROM detalle_venta d WHERE d.venta_id=v.id),0) AS unidades,
                COALESCE((SELECT string_agg(DISTINCT p.metodo,', ' ORDER BY p.metodo) FROM pago p WHERE p.venta_id=v.id),'') AS pagos
              FROM venta v LEFT JOIN cliente cl ON cl.id=v.cliente_id LEFT JOIN comprobante c ON c.venta_id=v.id
              LEFT JOIN serie_comprobante sc ON sc.id=c.serie_comprobante_id LEFT JOIN tipo_comprobante tc ON tc.id=sc.tipo_comprobante_id
              WHERE v.estado='CONFIRMADA' AND v.fecha>=:desde AND v.fecha<:hasta ORDER BY v.fecha,v.id
              """;
            case "compras" -> """
              SELECT c.id,'Compra #'||c.id AS documento,p.razon_social AS proveedor,p.ruc,
                to_char(c.fecha AT TIME ZONE 'America/Lima','DD/MM/YYYY HH24:MI') AS fecha,c.total,c.estado AS tipo,
                (SELECT count(*) FROM detalle_compra d WHERE d.compra_id=c.id) AS productos
              FROM compra c JOIN proveedor p ON p.id=c.proveedor_id
              WHERE c.fecha>=:desde AND c.fecha<:hasta ORDER BY c.fecha,c.id
              """;
            case "inventario" -> """
              WITH sales AS (
                SELECT d.producto_id,sum(d.cantidad) AS unidades,sum(d.subtotal) AS ingresos
                FROM detalle_venta d JOIN venta v ON v.id=d.venta_id WHERE v.estado='CONFIRMADA' AND v.fecha>=:desde AND v.fecha<:hasta GROUP BY d.producto_id
              ), products AS (
                SELECT p.id,p.codigo,p.nombre,c.nombre AS categoria,COALESCE(s.unidades,0) AS unidades,COALESCE(s.ingresos,0) AS ingresos,
                  COALESCE(st.cantidad,0) AS stock,p.precio_venta*COALESCE(st.cantidad,0) AS valor
                FROM producto p JOIN categoria c ON c.id=p.categoria_id LEFT JOIN sales s ON s.producto_id=p.id LEFT JOIN stock_disponible st ON st.producto_id=p.id WHERE p.activo
              ), abc AS (
                SELECT *,sum(ingresos) OVER (ORDER BY ingresos DESC,id ROWS UNBOUNDED PRECEDING)-ingresos AS prev,sum(ingresos) OVER () AS total FROM products
              ) SELECT *,CASE WHEN total=0 OR ingresos=0 THEN 'C' WHEN prev/total<0.8 THEN 'A' WHEN prev/total<0.95 THEN 'B' ELSE 'C' END AS tipo FROM abc ORDER BY ingresos DESC,id
              """;
            case "vencimientos" -> """
              SELECT l.id,p.codigo,p.nombre AS producto,l.numero_lote AS lote,to_char(l.fecha_vencimiento,'DD/MM/YYYY') AS vencimiento,
                l.fecha_vencimiento-(now() AT TIME ZONE 'America/Lima')::date AS dias,l.stock_actual AS unidades,
                CASE WHEN l.fecha_vencimiento<(now() AT TIME ZONE 'America/Lima')::date THEN 'VENCIDO'
                  WHEN l.fecha_vencimiento<=(now() AT TIME ZONE 'America/Lima')::date+30 THEN 'CRITICO'
                  WHEN l.fecha_vencimiento<=(now() AT TIME ZONE 'America/Lima')::date+90 THEN 'PREVENTIVO' ELSE 'OPTIMO' END AS tipo
              FROM lote l JOIN producto p ON p.id=l.producto_id WHERE p.activo AND l.disponible AND l.stock_actual>0
                AND l.fecha_vencimiento>=:fechaDesde AND l.fecha_vencimiento<=:fechaHasta ORDER BY l.fecha_vencimiento,l.id
              """;
            default -> throw new BadRequestException("Tipo de reporte inválido.");
        };
        var rows=jdbc.queryForList(sql+" LIMIT 100001",params);
        if(rows.size()>100000) throw new BadRequestException("Acota el período para consultar hasta 100000 registros.");
        return Map.of("rows",rows,"desde",desde,"hasta",hasta);
    }
}
