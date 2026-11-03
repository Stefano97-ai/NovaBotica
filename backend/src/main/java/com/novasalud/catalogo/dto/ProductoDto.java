package com.novasalud.catalogo.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductoDto(
    Long id,
    Long categoriaId,
    String categoriaNombre,
    String codigo,
    String nombre,
    String unidadBase,
    BigDecimal precioVenta,
    Integer stockMinimo,
    Long stockDisponible,
    boolean activo,
    Instant creadoEn
) {}
