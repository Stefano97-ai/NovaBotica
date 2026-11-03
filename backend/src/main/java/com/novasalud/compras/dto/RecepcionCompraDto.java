package com.novasalud.compras.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record RecepcionCompraDto(
    @NotNull(message = "El detalle de compra es obligatorio")
    Long detalleCompraId,

    @NotBlank(message = "El número de lote es obligatorio")
    String numeroLote,

    @NotNull(message = "La fecha de vencimiento es obligatoria")
    LocalDate fechaVencimiento,

    @NotNull(message = "La cantidad recibida es obligatoria")
    @Min(value = 1, message = "La cantidad recibida debe ser al menos 1")
    Integer cantidadRecibida
) {}
