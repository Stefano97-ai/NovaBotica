package com.novasalud.inventario.repository;

import com.novasalud.inventario.model.Lote;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface LoteRepository extends JpaRepository<Lote, Long> {

    List<Lote> findByProductoIdOrderByFechaVencimientoAsc(Long productoId);

    Optional<Lote> findByProductoIdAndNumeroLote(Long productoId, String numeroLote);

    /**
     * RN-03 / FEFO: Obtiene lotes vigentes de un producto ordenados por fecha de vencimiento más próxima.
     */
    @Query("SELECT l FROM Lote l WHERE l.producto.id = :productoId AND l.disponible = true AND l.stockActual > 0 AND l.fechaVencimiento >= :fechaActual ORDER BY l.fechaVencimiento ASC, l.id ASC")
    List<Lote> findLotesFefoVigentes(Long productoId, LocalDate fechaActual);

    /**
     * Lotes próximos a vencer en una ventana de días con stock > 0.
     */
    @Query("SELECT l FROM Lote l WHERE l.disponible = true AND l.stockActual > 0 AND l.fechaVencimiento >= :desde AND l.fechaVencimiento <= :hasta ORDER BY l.fechaVencimiento ASC")
    List<Lote> findLotesProximosAVencer(LocalDate desde, LocalDate hasta);

    /**
     * Lotes ya vencidos que aún tienen existencias (alerta de inventario).
     */
    @Query("SELECT l FROM Lote l WHERE l.disponible = true AND l.stockActual > 0 AND l.fechaVencimiento < :fechaActual ORDER BY l.fechaVencimiento ASC")
    List<Lote> findLotesVencidosConStock(LocalDate fechaActual);

    @Query("SELECT COALESCE(SUM(l.stockActual), 0) FROM Lote l WHERE l.producto.id = :productoId AND l.disponible = true AND l.fechaVencimiento >= :fechaActual")
    Long calcularStockDisponible(Long productoId, LocalDate fechaActual);
}
