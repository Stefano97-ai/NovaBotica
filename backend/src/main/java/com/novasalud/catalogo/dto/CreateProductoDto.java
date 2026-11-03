package com.novasalud.catalogo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateProductoDto(
    @NotNull(message = "La categoría es obligatoria")
    Long categoriaId,

    @NotBlank(message = "El código es obligatorio")
    @Size(min = 2, max = 60, message = "El código debe tener entre 2 y 60 caracteres")
    String codigo,

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 180, message = "El nombre debe tener entre 2 y 180 caracteres")
    String nombre,

    String unidadBase,

    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
    BigDecimal precioVenta,

    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    Integer stockMinimo
) {}
