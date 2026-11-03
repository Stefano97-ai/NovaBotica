package com.novasalud.comprobantes.dto;

import java.time.Instant;

public record ComprobanteResponseDto(
    Long id,
    Long ventaId,
    String tipoCodigo,
    String tipoNombre,
    String serie,
    Long correlativo,
    String numeroCompleto,
    String estado,
    boolean simulado,
    String datosDocumento,
    Instant creadoEn
) {}
