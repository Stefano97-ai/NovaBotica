package com.novasalud.ventas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

public record PagoDto(
    @NotBlank(message = "El método de pago es obligatorio")
    @Size(max=30)
    String metodo,

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    @Digits(integer=12,fraction=2)
    BigDecimal monto,

    @Size(max=160) String referencia
) {}
