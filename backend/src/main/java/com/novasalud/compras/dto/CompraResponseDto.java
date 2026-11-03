package com.novasalud.compras.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CompraResponseDto(
    Long id,
    Long proveedorId,
    String proveedorRuc,
    String proveedorRazonSocial,
    String usuarioNombre,
    Instant fecha,
    BigDecimal total,
    String estado,
    List<DetalleCompraResponseDto> detalles
) {}
