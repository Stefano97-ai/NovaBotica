package com.novasalud.inventario.repository;

import com.novasalud.inventario.model.Movimiento;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    List<Movimiento> findAllByOrderByFechaDesc();
    List<Movimiento> findByLoteIdOrderByFechaDesc(Long loteId);
    List<Movimiento> findByFechaBetweenOrderByFechaDesc(Instant start, Instant end);
    List<Movimiento> findByLoteProductoIdOrderByFechaDesc(Long productoId);
}
