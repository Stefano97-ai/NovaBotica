package com.novasalud.inventario.dto;

public record AlertaStockDto(
    Long productoId,
    String codigo,
    String nombre,
    Long stockDisponible,
    Integer stockMinimo,
    String nivel // 'CRITICO' si stock = 0, 'BAJO' si <= stockMinimo
) {}
