package com.novasalud.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUsuarioDto(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 160, message = "El nombre debe tener entre 2 y 160 caracteres")
    String nombre,

    String password,

    @NotBlank(message = "El rol es obligatorio")
    String rolCodigo,

    Boolean activo
) {}
