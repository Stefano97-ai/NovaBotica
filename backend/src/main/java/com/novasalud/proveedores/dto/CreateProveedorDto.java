package com.novasalud.proveedores.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateProveedorDto(
    @NotBlank(message = "El RUC es obligatorio")
    @Pattern(regexp = "^[0-9]{11}$", message = "El RUC debe tener exactamente 11 dígitos numéricos")
    String ruc,

    @NotBlank(message = "La razón social es obligatoria")
    @Size(min = 3, max = 180, message = "La razón social debe tener entre 3 y 180 caracteres")
    String razonSocial,

    String telefono,
    String correo,
    String direccion
) {}
