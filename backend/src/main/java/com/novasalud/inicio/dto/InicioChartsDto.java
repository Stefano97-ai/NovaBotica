package com.novasalud.inicio.dto;

import java.util.List;

public record InicioChartsDto(
    String from, String to, int days, SalesCharts sales,
    List<CriticalStock> criticalStock, List<ExpiryBucket> expirations
) {
    public record SalesCharts(List<DailySale> evolution, List<ProductSale> topProducts,
                              List<HourlySale> byHour, List<CategorySale> byCategory) {}
    public record DailySale(String date, long count, String total) {}
    public record ProductSale(String id, String name, long units, String total) {}
    public record HourlySale(int hour, long count, String total) {}
    public record CategorySale(String id, String name, long units, String total) {}
    public record CriticalStock(String id, String name, long available, int minimum, long shortage) {}
    public record ExpiryBucket(String label, long lots, long units) {}
}
