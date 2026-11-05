package com.novasalud.inventario.service;

import com.novasalud.catalogo.repository.ProductoRepository;
import com.novasalud.inventario.dto.CrearSerieDto;
import com.novasalud.inventario.dto.SerieDisponibleDto;
import com.novasalud.shared.exception.BusinessException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import com.novasalud.ventas.model.DetalleVentaLote;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SerieUnidadService {
    private final JdbcTemplate jdbc;
    private final FefoService fefo;
    private final ProductoRepository products;
    public SerieUnidadService(JdbcTemplate jdbc, FefoService fefo, ProductoRepository products) {
        this.jdbc=jdbc; this.fefo=fefo; this.products=products;
    }

    @Transactional(readOnly=true)
    public List<SerieDisponibleDto> disponibles(Long productId, int quantity) {
        if (quantity<1 || quantity>1000) throw new BusinessException("La cantidad para consultar series debe estar entre 1 y 1000.");
        var product=products.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        Map<Long,Integer> limits=new HashMap<>();
        for (var a:fefo.asignarLotes(productId,product.getNombre(),quantity)) limits.put(a.lote().getId(),a.cantidad());
        return jdbc.query("""
            SELECT u.id,u.lote_id,u.numero_serie,l.numero_lote,l.fecha_vencimiento::text
            FROM unidad_serializada u JOIN lote l ON l.id=u.lote_id JOIN producto p ON p.id=u.producto_id
            WHERE u.producto_id=? AND u.estado='DISPONIBLE' AND p.activo AND l.disponible
              AND l.stock_actual>0 AND l.fecha_vencimiento>=?
            ORDER BY l.fecha_vencimiento,l.id,u.numero_serie,u.id
            """, (rs,n)->new SerieDisponibleDto(rs.getLong(1),rs.getLong(2),rs.getString(3),rs.getString(4),rs.getString(5),
                limits.getOrDefault(rs.getLong(2),0)),productId,LocalDate.now(ZoneId.of("America/Lima")));
    }

    @Transactional
    public Long registrar(Long productId, CrearSerieDto dto) {
        var locked=products.lockForSale(List.of(productId));
        if (locked.isEmpty()) throw new ResourceNotFoundException("Producto no encontrado");
        var product=locked.getFirst();
        if (!product.isActivo()) throw new BusinessException("El producto está inactivo.");
        var receipt=jdbc.queryForList("""
            SELECT l.id FROM lote l JOIN detalle_compra d ON d.producto_id=l.producto_id
            WHERE l.id=? AND d.id=? AND l.producto_id=? AND l.disponible AND l.stock_actual>0
              AND l.fecha_vencimiento>=(now() AT TIME ZONE 'America/Lima')::date
              AND EXISTS (SELECT 1 FROM recepcion_lote r WHERE r.lote_id=l.id AND r.detalle_compra_id=d.id)
              AND (SELECT count(*) FROM unidad_serializada u WHERE u.lote_id=l.id AND u.estado='DISPONIBLE')<l.stock_actual
            FOR UPDATE OF l,d
            """,dto.loteId(),dto.detalleCompraId(),productId);
        if (receipt.isEmpty()) throw new BusinessException("La serie debe pertenecer a una recepción del lote con existencias disponibles.");
        if (jdbc.queryForObject("SELECT count(*) FROM unidad_serializada WHERE numero_serie=?",Long.class,dto.numeroSerie().trim())>0)
            throw new BusinessException("El número de serie ya está registrado.");
        Long id=jdbc.queryForObject("""
            INSERT INTO unidad_serializada(lote_id,detalle_compra_id,producto_id,numero_serie,codigo_escaneado)
            VALUES(?,?,?,?,?) RETURNING id
            """,Long.class,dto.loteId(),dto.detalleCompraId(),productId,dto.numeroSerie().trim(),
            dto.codigoEscaneado()==null || dto.codigoEscaneado().isBlank()?null:dto.codigoEscaneado().trim());
        product.setRequiereSerie(true);
        products.save(product);
        return id;
    }

    // Caller holds product locks and has flushed JPA allocations inside the sale transaction.
    public void asignar(Long productId, List<Long> ids, int quantity, List<DetalleVentaLote> allocations) {
        if (ids==null || ids.isEmpty()) return; // Explicitly optional, including products marked requiere_serie.
        if (ids.size()>quantity || new HashSet<>(ids).size()!=ids.size())
            throw new BusinessException("Selecciona series diferentes, como máximo una por unidad vendida.");
        Map<Long,DetalleVentaLote> byLot=new HashMap<>();
        Map<Long,Integer> counts=new HashMap<>();
        allocations.forEach(a->byLot.put(a.getLote().getId(),a));
        for (Long id:ids.stream().sorted().toList()) {
            var rows=jdbc.queryForList("SELECT lote_id FROM unidad_serializada WHERE id=? AND producto_id=? AND estado='DISPONIBLE' FOR UPDATE",id,productId);
            if (rows.isEmpty()) throw new BusinessException("Una de las series seleccionadas ya no está disponible para este producto. Vuelve a consultar las series.");
            Long lot=((Number)rows.getFirst().get("lote_id")).longValue();
            var allocation=byLot.get(lot);
            int used=counts.merge(lot,1,Integer::sum);
            if (allocation==null || used>allocation.getCantidad())
                throw new BusinessException("La selección de series no coincide con los lotes FEFO. Vuelve a consultar las series para esta cantidad.");
            jdbc.update("UPDATE unidad_serializada SET estado='VENDIDA',asignacion_id=? WHERE id=?",allocation.getId(),id);
        }
    }

    public void liberarVenta(Long saleId) {
        jdbc.update("""
            UPDATE unidad_serializada SET estado='DISPONIBLE',asignacion_id=NULL
            WHERE asignacion_id IN (SELECT a.id FROM detalle_venta_lote a JOIN detalle_venta d ON d.id=a.detalle_venta_id WHERE d.venta_id=?)
            """,saleId);
    }

    public List<com.novasalud.ventas.dto.DetalleVentaResponseDto.SerieVendida> deDetalle(Long detailId) {
        return jdbc.query("""
            SELECT u.id,u.numero_serie FROM unidad_serializada u JOIN detalle_venta_lote a ON a.id=u.asignacion_id
            WHERE a.detalle_venta_id=? ORDER BY u.numero_serie,u.id
            """,(rs,n)->new com.novasalud.ventas.dto.DetalleVentaResponseDto.SerieVendida(rs.getLong(1),rs.getString(2)),detailId);
    }
}
