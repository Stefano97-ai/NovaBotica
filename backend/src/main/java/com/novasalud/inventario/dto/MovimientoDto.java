package com.novasalud.inventario.dto;

import java.time.Instant;

public record MovimientoDto(
    Long id,
    Long loteId,
    String productoNombre,
    String numeroLote,
    String usuarioNombre,
    Instant fecha,
    String tipo,
    Integer cantidad,
    String motivo,
    String referencia,
    Long ventaId,
    Long recepcionLoteId,
    Integer saldoAnterior,
    Integer saldoPosterior,
    String origenTipo,
    Long origenId
) {}
