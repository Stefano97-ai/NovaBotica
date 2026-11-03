package com.novasalud.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateVentaDto(
    Long clienteId,
    String tipoComprobante, // BOLETA, FACTURA, NOTA_VENTA

    @NotEmpty(message = "La venta debe incluir al menos un producto")
    @Valid
    List<ItemVentaDto> items,

    @NotEmpty(message = "Debe registrar al menos una forma de pago")
    @Valid
    List<PagoDto> pagos,

    String claveIdempotencia
) {}
