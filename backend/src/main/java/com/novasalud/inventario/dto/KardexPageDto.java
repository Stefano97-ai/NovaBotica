package com.novasalud.inventario.dto;

import java.util.List;

public record KardexPageDto(List<KardexRowDto> items, long total, long noVerificables, int limit, int offset) {}
