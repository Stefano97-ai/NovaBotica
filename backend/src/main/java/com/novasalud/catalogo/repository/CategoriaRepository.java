package com.novasalud.catalogo.repository;

import com.novasalud.catalogo.model.Categoria;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    Optional<Categoria> findByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCase(String nombre);
    List<Categoria> findByActivoTrueOrderByNombreAsc();
    List<Categoria> findAllByOrderByNombreAsc();
}
