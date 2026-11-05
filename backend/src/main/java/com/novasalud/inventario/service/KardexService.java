package com.novasalud.inventario.service;

import com.novasalud.inventario.dto.*;
import com.novasalud.inventario.repository.KardexRepository;
import com.novasalud.shared.exception.BadRequestException;
import java.sql.Timestamp;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KardexService {
    private final KardexRepository repository;
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    public KardexService(KardexRepository repository) { this.repository = repository; }
    private Map<String,Object> params(KardexQuery q) {
        if (q.desde()!=null && q.hasta()!=null && q.desde().isAfter(q.hasta())) throw new BadRequestException("La fecha inicial no puede superar la final.");
        Map<String,Object> p = new HashMap<>();
        if (q.productoId()!=null) p.put("productoId",q.productoId());
        if (q.loteId()!=null) p.put("loteId",q.loteId());
        if (q.usuarioId()!=null) p.put("usuarioId",q.usuarioId());
        if (q.tipo()!=null) p.put("tipo",q.tipo());
        if (q.origen()!=null) p.put("origen",q.origen());
        if (q.desde()!=null) p.put("desde",Timestamp.from(q.desde().atStartOfDay(LIMA).toInstant()));
        if (q.hasta()!=null) p.put("hasta",Timestamp.from(q.hasta().plusDays(1).atStartOfDay(LIMA).toInstant()));
        if (q.referencia()!=null && !q.referencia().isBlank()) p.put("referencia",q.referencia().trim());
        p.put("limit",q.limit()==null?25:q.limit()); p.put("offset",q.offset()==null?0:q.offset());
        return p;
    }
    @Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
    public KardexPageDto list(KardexQuery q) {
        var p=params(q); var counts=repository.counts(p);
        return new KardexPageDto(repository.rows(p,true),((Number)counts.get("total")).longValue(),
            ((Number)counts.get("unverifiable")).longValue(),(int)p.get("limit"),(int)p.get("offset"));
    }
    @Transactional(readOnly=true)
    public Map<String,Object> options() { return repository.options(); }

    @Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
    public java.util.List<KardexRowDto> exportRows(KardexQuery q) {
        var p=params(q);
        if (((Number)repository.counts(p).get("total")).longValue()>100000) throw new BadRequestException("Acota los filtros para exportar hasta 100000 movimientos.");
        return repository.rows(p,false);
    }

    @Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
    public String export(KardexQuery q) {
        var p=params(q);
        if (((Number)repository.counts(p).get("total")).longValue()>100000) throw new BadRequestException("Acota el período o producto para exportar hasta 100000 movimientos.");
        var csv=new StringBuilder("\uFEFFFecha (Lima),Código,Producto,Lote,Tipo,Origen,Responsable,Referencia,Motivo,Saldo anterior del lote,Entrada,Salida,Saldo posterior del lote,Verificación\r\n");
        var format=DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss").withZone(LIMA);
        for (var r:repository.rows(p,false)) {
            var cells=Arrays.asList(format.format(r.fecha()),r.codigo(),r.producto(),r.lote(),r.tipo(),r.origen(),r.responsable(),r.referencia(),r.motivo(),
                r.saldoAnterior(),r.entrada(),r.salida(),r.saldoPosterior(),r.verificacion());
            csv.append(cells.stream().map(KardexService::cell).collect(java.util.stream.Collectors.joining(","))).append("\r\n");
        }
        return csv.toString();
    }
    private static String cell(Object value) {
        if (value==null) return "\"No verificable\"";
        String s=value.toString();
        if (!(value instanceof Number) && s.stripLeading().matches("(?s)^[=+@-].*")) s="'"+s;
        return "\""+s.replace("\"","\"\"")+"\"";
    }
}
