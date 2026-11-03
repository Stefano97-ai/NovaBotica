package com.novasalud.reportes.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class ReportesDto {

    public record ResumenVentasDto(
        long totalOperaciones,
        BigDecimal totalVentas,
        BigDecimal totalSubtotal,
        BigDecimal totalImpuesto,
        Map<String, BigDecimal> totalesPorMetodoPago,
        List<?> ventas
    ) {}

    public record ResumenComprasDto(
        long totalOrdenes,
        BigDecimal totalInvertido,
        Map<String, Long> ordenesPorEstado,
        List<?> compras
    ) {}

    public record ResumenInventarioDto(
        long totalProductos,
        long totalLotesActivos,
        long totalUnidadesEnStock,
        long productosBajoStock,
        long lotesVencidos,
        long lotesPorVencer
    ) {}
}
