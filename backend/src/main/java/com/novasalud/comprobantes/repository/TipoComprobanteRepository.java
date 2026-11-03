package com.novasalud.comprobantes.repository;

import com.novasalud.comprobantes.model.TipoComprobante;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoComprobanteRepository extends JpaRepository<TipoComprobante, Long> {
    Optional<TipoComprobante> findByCodigo(String codigo);
    Optional<TipoComprobante> findByCodigoIgnoreCase(String codigo);
}
