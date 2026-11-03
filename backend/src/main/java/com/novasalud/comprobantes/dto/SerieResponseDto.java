package com.novasalud.comprobantes.dto;

public record SerieResponseDto(
    Long id,
    String tipoCodigo,
    String tipoNombre,
    String serie,
    Long ultimoCorrelativo,
    boolean activo
) {}
