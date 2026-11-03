package com.novasalud.inventario.dto;

import java.time.LocalDate;

public record AlertaVencimientoDto(
    Long loteId,
    Long productoId,
    String productoNombre,
    String numeroLote,
    Integer stockActual,
    LocalDate fechaVencimiento,
    long diasRestantes,
    String estado // 'VENCIDO' o 'POR_VENCER'
) {}
