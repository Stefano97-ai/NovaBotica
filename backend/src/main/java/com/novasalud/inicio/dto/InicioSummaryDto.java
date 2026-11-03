package com.novasalud.inicio.dto;

import java.util.List;

public record InicioSummaryDto(
    String updatedAt,
    int products,
    int lowStock,
    int expired,
    int expiringCount,
    List<ExpiringItemDto> expiring,
    SalesSummaryDto sales
) {
    public record ExpiringItemDto(
        String id,
        String producto,
        String lote,
        String vencimiento,
        int unidades
    ) {}

    public record SalesSummaryDto(
        int count,
        String total
    ) {}
}
