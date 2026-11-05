package com.novasalud.alertas.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novasalud.alertas.dto.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AlertaRepository {
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper json;
    public AlertaRepository(NamedParameterJdbcTemplate jdbc,ObjectMapper json) { this.jdbc=jdbc; this.json=json; }

    private static final String RECONCILE="""
        WITH day AS (SELECT (now() AT TIME ZONE 'America/Lima')::date AS today), candidates AS (
          SELECT CASE WHEN s.cantidad=0 THEN 'AGOTADO' ELSE 'STOCK_BAJO' END AS tipo,
            CASE WHEN s.cantidad=0 THEN 'CRITICA' ELSE 'MEDIA' END AS prioridad,p.id AS producto_id,NULL::bigint AS lote_id,
            jsonb_build_object('producto',p.nombre,'codigo',p.codigo,'stock',s.cantidad,'minimo',p.stock_minimo) AS datos
          FROM producto p JOIN stock_disponible s ON s.producto_id=p.id WHERE p.activo AND s.cantidad<=p.stock_minimo
          UNION ALL
          SELECT CASE WHEN l.fecha_vencimiento<d.today THEN 'VENCIDO'
              WHEN l.fecha_vencimiento<=d.today+:urgent::int THEN 'VENCIMIENTO_URGENTE' ELSE 'POR_VENCER' END,
            CASE WHEN l.fecha_vencimiento<d.today THEN 'CRITICA'
              WHEN l.fecha_vencimiento<=d.today+:urgent::int THEN 'ALTA' ELSE 'MEDIA' END,
            NULL::bigint,l.id,jsonb_build_object('producto',p.nombre,'codigo',p.codigo,'productoId',p.id::text,
              'lote',l.numero_lote,'unidades',l.stock_actual,'vencimiento',l.fecha_vencimiento::text,'dias',l.fecha_vencimiento-d.today)
          FROM lote l JOIN producto p ON p.id=l.producto_id CROSS JOIN day d
          WHERE p.activo AND l.disponible AND l.stock_actual>0 AND l.fecha_vencimiento<=d.today+:window::int
        ), changed AS (
          UPDATE alerta a SET tipo=c.tipo,prioridad=c.prioridad,datos=c.datos,actualizada_en=now(),
            version=a.version+CASE WHEN (CASE c.prioridad WHEN 'CRITICA' THEN 3 WHEN 'ALTA' THEN 2 ELSE 1 END)>
              (CASE a.prioridad WHEN 'CRITICA' THEN 3 WHEN 'ALTA' THEN 2 ELSE 1 END) THEN 1 ELSE 0 END
          FROM candidates c WHERE a.estado='ACTIVA' AND
            (a.producto_id=c.producto_id OR a.lote_id=c.lote_id)
            AND (a.tipo IS DISTINCT FROM c.tipo OR a.prioridad IS DISTINCT FROM c.prioridad OR a.datos IS DISTINCT FROM c.datos)
          RETURNING a.id
        ), resolved AS (
          UPDATE alerta a SET estado='RESUELTA',resuelta_en=now(),actualizada_en=now()
          WHERE a.estado='ACTIVA' AND NOT EXISTS(SELECT 1 FROM candidates c WHERE a.producto_id=c.producto_id OR a.lote_id=c.lote_id)
          RETURNING a.id
        )
        INSERT INTO alerta(tipo,prioridad,producto_id,lote_id,datos)
        SELECT c.tipo,c.prioridad,c.producto_id,c.lote_id,c.datos FROM candidates c
        WHERE NOT EXISTS(SELECT 1 FROM alerta a WHERE a.estado='ACTIVA' AND (a.producto_id=c.producto_id OR a.lote_id=c.lote_id))
        ON CONFLICT DO NOTHING
        """;

    public void reconcile(int window,int urgent) {
        jdbc.getJdbcTemplate().execute("SELECT pg_advisory_xact_lock(5272027)");
        jdbc.update(RECONCILE,Map.of("window",window,"urgent",urgent));
        // Audience is shared; reading remains individual. Preserve the audience of resolved episodes.
        jdbc.update("""
            DELETE FROM alerta_rol ar USING alerta a,rol r WHERE ar.alerta_id=a.id AND ar.rol_id=r.id AND a.estado='ACTIVA'
              AND NOT (r.codigo IN ('ADMINISTRADOR','ALMACENERO') OR
                (r.codigo='VENDEDOR' AND a.tipo IN ('AGOTADO','VENCIMIENTO_URGENTE','VENCIDO')))
            """,Map.of());
        jdbc.update("""
            INSERT INTO alerta_rol(alerta_id,rol_id) SELECT a.id,r.id FROM alerta a CROSS JOIN rol r WHERE a.estado='ACTIVA'
              AND (r.codigo IN ('ADMINISTRADOR','ALMACENERO') OR
                (r.codigo='VENDEDOR' AND a.tipo IN ('AGOTADO','VENCIMIENTO_URGENTE','VENCIDO')))
            ON CONFLICT DO NOTHING
            """,Map.of());
    }

    private static final String VISIBLE="""
        FROM alerta a JOIN alerta_rol ar ON ar.alerta_id=a.id JOIN rol r ON r.id=ar.rol_id
        LEFT JOIN alerta_usuario au ON au.alerta_id=a.id AND au.usuario_id=:userId::bigint
        WHERE r.codigo=:role
        """;
    private static final String FILTER="""
        AND (:state='TODAS' OR a.estado=:state) AND (:type='TODAS' OR a.tipo=:type)
        AND (:priority='TODAS' OR a.prioridad=:priority)
        AND (NOT :unread::boolean OR COALESCE(au.version_leida,0)<a.version)
        """;

    public AlertasPageDto list(String userId,String role,String state,String type,String priority,boolean unread,int limit,int offset) {
        var params=new HashMap<String,Object>();
        params.put("userId",Long.parseLong(userId));params.put("role",role);params.put("state",state);
        params.put("type",type);params.put("priority",priority);params.put("unread",unread);params.put("limit",limit);params.put("offset",offset);
        long count=jdbc.queryForObject("SELECT count(*) "+VISIBLE+FILTER,params,Long.class);
        long badge=jdbc.queryForObject("SELECT count(*) "+VISIBLE+" AND a.estado='ACTIVA' AND COALESCE(au.version_leida,0)<a.version",params,Long.class);
        List<AlertaDto> items=jdbc.query("""
            SELECT a.*,COALESCE(au.version_leida,0)>=a.version AS leida
            """+VISIBLE+FILTER+"""
            ORDER BY CASE a.prioridad WHEN 'CRITICA' THEN 0 WHEN 'ALTA' THEN 1 ELSE 2 END,
              a.actualizada_en DESC,a.id DESC LIMIT :limit OFFSET :offset
            """,params,(rs,n)->{
                try {
                    var data=json.readValue(rs.getString("datos"),new TypeReference<Map<String,Object>>(){});
                    Timestamp resolved=rs.getTimestamp("resuelta_en");
                    return new AlertaDto(rs.getString("id"),rs.getString("tipo"),rs.getString("prioridad"),rs.getString("estado"),
                        rs.getString("producto_id"),rs.getString("lote_id"),data,rs.getInt("version"),rs.getBoolean("leida"),
                        rs.getTimestamp("creada_en").toInstant(),rs.getTimestamp("actualizada_en").toInstant(),resolved==null?null:resolved.toInstant());
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalStateException("Datos de alerta inválidos",e); }
            });
        return new AlertasPageDto(items,count,badge,limit,offset,Instant.now());
    }

    public int read(String userId,String role,Long id,int version) {
        return jdbc.update("""
            INSERT INTO alerta_usuario(alerta_id,usuario_id,version_leida)
            SELECT a.id,:userId::bigint,:version FROM alerta a JOIN alerta_rol ar ON ar.alerta_id=a.id JOIN rol r ON r.id=ar.rol_id
            WHERE a.id=:id AND r.codigo=:role AND a.version>=:version
            ON CONFLICT(alerta_id,usuario_id) DO UPDATE
            SET version_leida=GREATEST(alerta_usuario.version_leida,EXCLUDED.version_leida),
                leida_en=CASE WHEN EXCLUDED.version_leida>alerta_usuario.version_leida THEN now() ELSE alerta_usuario.leida_en END
            """,Map.of("userId",Long.parseLong(userId),"role",role,"id",id,"version",version));
    }
    public void readAll(String userId,String role) {
        jdbc.update("""
            INSERT INTO alerta_usuario(alerta_id,usuario_id,version_leida)
            SELECT a.id,:userId::bigint,a.version FROM alerta a JOIN alerta_rol ar ON ar.alerta_id=a.id JOIN rol r ON r.id=ar.rol_id
            WHERE a.estado='ACTIVA' AND r.codigo=:role
            ON CONFLICT(alerta_id,usuario_id) DO UPDATE SET version_leida=GREATEST(alerta_usuario.version_leida,EXCLUDED.version_leida),
              leida_en=CASE WHEN EXCLUDED.version_leida>alerta_usuario.version_leida THEN now() ELSE alerta_usuario.leida_en END
            """,Map.of("userId",Long.parseLong(userId),"role",role));
    }
}
