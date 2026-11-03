package com.novasalud.ventas.dto;

import com.novasalud.comprobantes.dto.ComprobanteResponseDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record VentaResponseDto(
    Long id,
    Long clienteId,
    String clienteNombre,
    String usuarioNombre,
    Instant fecha,
    BigDecimal subtotal,
    BigDecimal impuesto,
    BigDecimal total,
    String estado,
    List<DetalleVentaResponseDto> detalles,
    List<PagoDto> pagos,
    ComprobanteResponseDto comprobante
) {}
