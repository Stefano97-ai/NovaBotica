package com.novasalud.inventario.dto;

public record SerieDisponibleDto(Long id, Long loteId, String numeroSerie, String numeroLote,
    String vencimiento, int limiteLote) {}
