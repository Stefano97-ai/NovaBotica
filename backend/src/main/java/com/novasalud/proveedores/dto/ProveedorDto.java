package com.novasalud.proveedores.dto;

public record ProveedorDto(
    Long id,
    String ruc,
    String razonSocial,
    String telefono,
    String correo,
    String direccion,
    boolean activo
) {}
