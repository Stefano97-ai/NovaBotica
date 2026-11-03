package com.novasalud.comprobantes.repository;

import com.novasalud.comprobantes.model.Comprobante;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {
    Optional<Comprobante> findByVentaId(Long ventaId);
    List<Comprobante> findAllByOrderByCreadoEnDesc();
    Optional<Comprobante> findBySerieComprobanteIdAndCorrelativo(Long serieId, Long correlativo);
}
