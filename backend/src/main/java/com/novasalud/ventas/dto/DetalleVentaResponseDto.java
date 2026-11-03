package com.novasalud.ventas.dto;

import java.math.BigDecimal;
import java.util.List;

public record DetalleVentaResponseDto(
    Long id,
    Long productoId,
    String productoCodigo,
    String productoNombre,
    Integer cantidad,
    BigDecimal precioUnitario,
    BigDecimal subtotal,
    BigDecimal impuesto,
    BigDecimal total,
    List<AsignacionLoteDto> lotes
) {}
