package com.novasalud.ventas.repository;

import com.novasalud.ventas.model.DetalleVentaLote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleVentaLoteRepository extends JpaRepository<DetalleVentaLote, Long> {
    List<DetalleVentaLote> findByDetalleVentaId(Long detalleVentaId);
}
