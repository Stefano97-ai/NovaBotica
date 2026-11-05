package com.novasalud.compras.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Purchase and full receipt are committed together, including optional serialized units. */
public record RegistroCompraDto(
    @NotNull @Positive Long proveedorId,
    @NotEmpty @Size(max = 500) List<@Valid Linea> items
) {
    public record Linea(
        @NotNull @Positive Long productoId,
        @NotNull @Min(1) @Max(10000) Integer cantidad,
        @NotNull @DecimalMin("0.0") BigDecimal costoUnitario,
        @NotBlank @Size(max = 80) String numeroLote,
        @NotNull @FutureOrPresent LocalDate fechaVencimiento,
        @Size(max = 10000) List<@NotBlank @Size(max = 160) String> series
    ) {}
}
