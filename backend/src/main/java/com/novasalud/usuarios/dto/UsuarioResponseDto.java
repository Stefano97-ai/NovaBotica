package com.novasalud.usuarios.dto;

import java.time.Instant;

public record UsuarioResponseDto(
    Long id,
    String username,
    String nombre,
    String rolCodigo,
    String rolNombre,
    boolean activo,
    Instant creadoEn
) {}
