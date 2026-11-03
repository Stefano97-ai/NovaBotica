package com.novasalud.compras.repository;

import com.novasalud.compras.model.Compra;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {
    List<Compra> findAllByOrderByFechaDesc();
    List<Compra> findByEstadoOrderByFechaDesc(String estado);
    List<Compra> findByProveedorIdOrderByFechaDesc(Long proveedorId);
    List<Compra> findByFechaBetweenOrderByFechaDesc(Instant start, Instant end);

    @Query("SELECT COUNT(c) FROM Compra c WHERE c.estado = 'PENDIENTE' OR c.estado = 'PARCIAL'")
    long countComprasPendientesOParciales();
}
