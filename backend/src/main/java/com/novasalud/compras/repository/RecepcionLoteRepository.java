package com.novasalud.compras.repository;

import com.novasalud.compras.model.RecepcionLote;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RecepcionLoteRepository extends JpaRepository<RecepcionLote, Long> {
    List<RecepcionLote> findByDetalleCompraId(Long detalleCompraId);
    Optional<RecepcionLote> findByClaveIdempotencia(UUID claveIdempotencia);

    @Query("SELECT COALESCE(SUM(r.cantidadRecibida), 0) FROM RecepcionLote r WHERE r.detalleCompra.id = :detalleCompraId")
    Integer sumCantidadRecibidaByDetalleCompraId(Long detalleCompraId);
}
