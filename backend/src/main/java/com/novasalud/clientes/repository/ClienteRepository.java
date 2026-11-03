package com.novasalud.clientes.repository;

import com.novasalud.clientes.model.Cliente;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByTipoDocumentoAndNumeroDocumento(String tipoDocumento, String numeroDocumento);
    Optional<Cliente> findByNumeroDocumento(String numeroDocumento);
    List<Cliente> findAllByOrderByNombreAsc();

    @Query("SELECT c FROM Cliente c WHERE c.numeroDocumento LIKE CONCAT('%', :query, '%') OR LOWER(c.nombre) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Cliente> buscarPorNumeroONombre(String query);
}
