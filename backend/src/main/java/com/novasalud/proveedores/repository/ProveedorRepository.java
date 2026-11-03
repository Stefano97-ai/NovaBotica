package com.novasalud.proveedores.repository;

import com.novasalud.proveedores.model.Proveedor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    Optional<Proveedor> findByRuc(String ruc);
    boolean existsByRuc(String ruc);
    List<Proveedor> findByActivoTrueOrderByRazonSocialAsc();
    List<Proveedor> findAllByOrderByRazonSocialAsc();

    @Query("SELECT p FROM Proveedor p WHERE p.activo = true AND (p.ruc LIKE CONCAT('%', :query, '%') OR LOWER(p.razonSocial) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Proveedor> buscarPorRucORazonSocial(String query);
}
