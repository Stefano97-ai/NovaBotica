package com.novasalud.inventario.dto;

import java.time.LocalDate;

public record LoteDto(
    Long id,
    Long productoId,
    String productoCodigo,
    String productoNombre,
    String numeroLote,
    LocalDate fechaIngreso,
    LocalDate fechaVencimiento,
    Integer stockActual,
    boolean disponible,
    boolean vencido
) {}
