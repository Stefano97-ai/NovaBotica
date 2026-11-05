package com.novasalud.inventario.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

public record KardexQuery(
    @Positive Long productoId, @Positive Long loteId,
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
    @Pattern(regexp = "ENTRADA|SALIDA|AJUSTE") String tipo,
    @Pattern(regexp = "VENTA|RECEPCION_LOTE|MANUAL") String origen,
    @Positive Long usuarioId, @Size(max = 160) String referencia,
    @Min(1) @Max(100) Integer limit, @Min(0) Integer offset
) {}
