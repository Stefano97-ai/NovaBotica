package com.novasalud.compras.dto;

import java.math.BigDecimal;

public record DetalleCompraResponseDto(
    Long id,
    Long productoId,
    String productoCodigo,
    String productoNombre,
    Integer cantidad,
    BigDecimal costoUnitario,
    BigDecimal subtotal,
    Integer cantidadRecibida,
    Integer cantidadPendiente
) {}
