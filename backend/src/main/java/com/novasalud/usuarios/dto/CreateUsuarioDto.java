package com.novasalud.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUsuarioDto(
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 80, message = "El usuario debe tener entre 3 y 80 caracteres")
    String username,

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 160, message = "El nombre debe tener entre 2 y 160 caracteres")
    String nombre,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    String password,

    @NotBlank(message = "El rol es obligatorio")
    String rolCodigo
) {}
