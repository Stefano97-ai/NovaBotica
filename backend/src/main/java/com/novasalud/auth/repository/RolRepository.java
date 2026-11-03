package com.novasalud.auth.repository;

import com.novasalud.auth.model.Rol;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RolRepository extends JpaRepository<Rol, Long> {
    Optional<Rol> findByCodigo(String codigo);
    Optional<Rol> findByCodigoIgnoreCase(String codigo);
}
