package com.novasalud.clientes.dto;

public record ClienteDto(
    Long id,
    String tipoDocumento,
    String numeroDocumento,
    String nombre,
    String direccion,
    String correo,
    String telefono
) {}
