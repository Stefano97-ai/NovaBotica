package com.novasalud.comprobantes.repository;

import com.novasalud.comprobantes.model.SerieComprobante;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SerieComprobanteRepository extends JpaRepository<SerieComprobante, Long> {
    Optional<SerieComprobante> findByTipoComprobanteCodigoAndActivoTrue(String tipoCodigo);
    Optional<SerieComprobante> findBySerie(String serie);
    List<SerieComprobante> findByActivoTrue();

    @Query("SELECT s FROM SerieComprobante s WHERE LOWER(s.tipoComprobante.codigo) = LOWER(:tipoCodigo) AND s.activo = true")
    Optional<SerieComprobante> findFirstByTipoCodigo(String tipoCodigo);
}
