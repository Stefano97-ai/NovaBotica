package com.novasalud.alertas.dto;

import java.time.Instant;
import java.util.Map;

public record AlertaDto(String id, String tipo, String prioridad, String estado, String productoId,
    String loteId, Map<String,Object> datos, int version, boolean leida, Instant creadaEn,
    Instant actualizadaEn, Instant resueltaEn) {}
