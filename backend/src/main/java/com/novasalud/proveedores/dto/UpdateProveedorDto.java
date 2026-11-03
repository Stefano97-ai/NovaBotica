package com.novasalud.proveedores.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProveedorDto(
    @NotBlank(message = "La razón social es obligatoria")
    @Size(min = 3, max = 180, message = "La razón social debe tener entre 3 y 180 caracteres")
    String razonSocial,

    String telefono,
    String correo,
    String direccion,
    Boolean activo
) {}
