package com.novasalud.alertas.dto;

import java.time.Instant;
import java.util.List;

public record AlertasPageDto(List<AlertaDto> items, long total, long unreadCount, int limit, int offset, Instant checkedAt) {}
