package com.novasalud.ventas.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ItemVentaDto(
    @NotNull(message = "El producto es obligatorio")
    Long productoId,

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    Integer cantidad,

    BigDecimal precioUnitario,
    @Size(max = 1000) List<@NotNull @Positive Long> unidadesSerializadas
) {}
