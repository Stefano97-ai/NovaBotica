package com.novasalud.inventario.dto;

import jakarta.validation.constraints.*;

public record CrearSerieDto(@NotNull @Positive Long loteId, @NotNull @Positive Long detalleCompraId,
    @NotBlank @Size(max=160) String numeroSerie, @Size(max=300) String codigoEscaneado) {}
