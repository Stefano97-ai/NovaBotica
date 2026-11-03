package com.novasalud.ventas.repository;

import com.novasalud.ventas.model.Venta;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findAllByOrderByFechaDesc();
    List<Venta> findByEstadoOrderByFechaDesc(String estado);
    List<Venta> findByUsuarioIdOrderByFechaDesc(Long usuarioId);
    List<Venta> findByFechaBetweenOrderByFechaDesc(Instant start, Instant end);
    Optional<Venta> findByClaveIdempotencia(UUID claveIdempotencia);
    Optional<Venta> findBySolicitudHash(String solicitudHash);

    @Query("SELECT COUNT(v) FROM Venta v WHERE v.estado = 'CONFIRMADA' AND v.fecha >= :inicio AND v.fecha <= :fin")
    long countVentasConfirmadasEnRango(Instant inicio, Instant fin);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.estado = 'CONFIRMADA' AND v.fecha >= :inicio AND v.fecha <= :fin")
    BigDecimal sumTotalVentasConfirmadasEnRango(Instant inicio, Instant fin);

    @Query("SELECT COUNT(v) FROM Venta v WHERE v.usuario.id = :usuarioId AND v.estado = 'CONFIRMADA' AND v.fecha >= :inicio AND v.fecha <= :fin")
    long countVentasUsuarioEnRango(Long usuarioId, Instant inicio, Instant fin);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.usuario.id = :usuarioId AND v.estado = 'CONFIRMADA' AND v.fecha >= :inicio AND v.fecha <= :fin")
    BigDecimal sumTotalVentasUsuarioEnRango(Long usuarioId, Instant inicio, Instant fin);
}
