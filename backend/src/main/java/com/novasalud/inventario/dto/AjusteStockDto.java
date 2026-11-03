package com.novasalud.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AjusteStockDto(
    @NotNull(message = "El lote es obligatorio")
    Long loteId,

    @NotNull(message = "La cantidad es obligatoria")
    Integer cantidad, // Positiva (ingreso) o negativa (merma/daño)

    @NotBlank(message = "El motivo es obligatorio")
    String motivo,

    @NotBlank(message = "La referencia es obligatoria")
    String referencia
) {}
