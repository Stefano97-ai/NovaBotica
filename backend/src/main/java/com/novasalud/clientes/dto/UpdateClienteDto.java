package com.novasalud.clientes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateClienteDto(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 180, message = "El nombre debe tener entre 2 y 180 caracteres")
    String nombre,

    String direccion,
    String correo,
    String telefono
) {}
