package com.novasalud.inventario.repository;

import com.novasalud.inventario.dto.*;
import java.util.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class KardexRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public KardexRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }

    // Reconstruct only a complete, nonnegative lot ledger reconciled with current stock.
    // Every window sees the full history BEFORE date/type/reference filtering or pagination.
    private static final String LEDGER = """
        WITH ledger AS (
          SELECT m.*,l.producto_id,p.codigo,p.nombre AS producto,l.numero_lote AS lote,l.stock_actual,
            u.nombre AS responsable,
            sum(m.cantidad) OVER (PARTITION BY m.lote_id ORDER BY m.fecha,m.id) AS acumulado,
            sum(m.cantidad) OVER (PARTITION BY m.lote_id) AS total_lote
          FROM movimiento m JOIN lote l ON l.id=m.lote_id JOIN producto p ON p.id=l.producto_id
          JOIN usuario u ON u.id=m.usuario_id
        ), balances AS (
          SELECT *,min(acumulado) OVER (PARTITION BY lote_id)>=0 AND total_lote=stock_actual AS completo
          FROM ledger
        ), rows AS (
          SELECT *,COALESCE(saldo_anterior::bigint,CASE WHEN completo THEN acumulado-cantidad END) AS anterior,
            COALESCE(saldo_posterior::bigint,CASE WHEN completo THEN acumulado END) AS posterior,
            CASE WHEN saldo_anterior IS NOT NULL THEN 'REGISTRADO'
                 WHEN completo THEN 'RECONSTRUIDO' ELSE 'NO_VERIFICABLE' END AS verificacion
          FROM balances
        )
        """;
    private String where(Map<String,Object> params) {
        var sql = new StringBuilder(" WHERE true");
        for (String key : List.of("productoId", "loteId", "usuarioId", "tipo", "origen")) {
            if (!params.containsKey(key)) continue;
            String column = switch (key) {
                case "productoId" -> "producto_id"; case "loteId" -> "lote_id";
                case "usuarioId" -> "usuario_id"; case "origen" -> "origen_tipo"; default -> "tipo";
            };
            sql.append(" AND ").append(column).append("=:").append(key);
        }
        if (params.containsKey("desde")) sql.append(" AND fecha>=:desde");
        if (params.containsKey("hasta")) sql.append(" AND fecha<:hasta");
        if (params.containsKey("referencia")) sql.append(" AND strpos(lower(concat_ws(' ',referencia,motivo,origen_id::text)),lower(:referencia))>0");
        return sql.toString();
    }
    public Map<String,Object> counts(Map<String,Object> params) {
        return jdbc.queryForMap(LEDGER + "SELECT count(*) AS total,count(*) FILTER (WHERE posterior IS NULL) AS unverifiable FROM rows" + where(params), params);
    }
    public List<KardexRowDto> rows(Map<String,Object> params, boolean paginated) {
        String sql = LEDGER + "SELECT * FROM rows" + where(params) + " ORDER BY fecha,id" + (paginated ? " LIMIT :limit OFFSET :offset" : "");
        return jdbc.query(sql, params, (rs,n) -> new KardexRowDto(rs.getLong("id"),rs.getLong("producto_id"),rs.getString("codigo"),
            rs.getString("producto"),rs.getLong("lote_id"),rs.getString("lote"),rs.getTimestamp("fecha").toInstant(),
            rs.getString("tipo"),rs.getString("origen_tipo"),rs.getLong("usuario_id"),rs.getString("responsable"),
            rs.getString("motivo"),rs.getString("referencia"),rs.getObject("anterior",Long.class),
            Math.max(0,rs.getLong("cantidad")),Math.max(0,-rs.getLong("cantidad")),rs.getObject("posterior",Long.class),rs.getString("verificacion")));
    }
    public Map<String,Object> options() {
        return Map.of(
            "productos",jdbc.queryForList("SELECT p.id,p.codigo,p.nombre FROM producto p ORDER BY p.nombre,p.id",Map.of()),
            "lotes",jdbc.queryForList("SELECT l.id,l.producto_id AS \"productoId\",l.numero_lote AS nombre FROM lote l WHERE EXISTS(SELECT 1 FROM movimiento m WHERE m.lote_id=l.id) ORDER BY l.numero_lote,l.id",Map.of()),
            "usuarios",jdbc.queryForList("SELECT u.id,u.nombre,u.username FROM usuario u WHERE EXISTS(SELECT 1 FROM movimiento m WHERE m.usuario_id=u.id) ORDER BY u.nombre,u.id",Map.of())
        );
    }
}
