package com.novasalud.inventario.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateLoteDto(
    @NotNull(message = "El producto es obligatorio")
    Long productoId,

    @NotBlank(message = "El número de lote es obligatorio")
    String numeroLote,

    LocalDate fechaIngreso,

    @NotNull(message = "La fecha de vencimiento es obligatoria")
    LocalDate fechaVencimiento,

    @NotNull(message = "El stock inicial es obligatorio")
    @Min(value = 0, message = "El stock no puede ser negativo")
    Integer stockActual
) {}
