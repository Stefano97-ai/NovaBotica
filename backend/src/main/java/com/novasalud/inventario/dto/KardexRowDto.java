package com.novasalud.inventario.dto;

import java.time.Instant;

public record KardexRowDto(
    Long id, Long productoId, String codigo, String producto, Long loteId, String lote,
    Instant fecha, String tipo, String origen, Long usuarioId, String responsable,
    String motivo, String referencia, Long saldoAnterior, long entrada, long salida,
    Long saldoPosterior, String verificacion
) {}
