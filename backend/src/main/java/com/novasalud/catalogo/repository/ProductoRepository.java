package com.novasalud.catalogo.repository;

import com.novasalud.catalogo.model.Producto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Optional<Producto> findByCodigo(String codigo);
    Optional<Producto> findByCodigoIgnoreCase(String codigo);
    boolean existsByCodigoIgnoreCase(String codigo);
    List<Producto> findByActivoTrueOrderByNombreAsc();
    List<Producto> findAllByOrderByNombreAsc();
    List<Producto> findByCategoriaIdAndActivoTrue(Long categoriaId);

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND (LOWER(p.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.codigo) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Producto> buscarPorNombreOCodigo(String query);
}
