package com.novasalud.clientes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateClienteDto(
    @NotBlank(message = "El tipo de documento es obligatorio")
    @Pattern(regexp = "^(DNI|RUC)$", message = "El tipo de documento debe ser DNI o RUC")
    String tipoDocumento,

    @NotBlank(message = "El número de documento es obligatorio")
    String numeroDocumento,

    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Size(min = 2, max = 180, message = "El nombre debe tener entre 2 y 180 caracteres")
    String nombre,

    String direccion,
    String correo,
    String telefono
) {}
