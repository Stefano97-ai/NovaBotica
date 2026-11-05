package com.novasalud.inicio.controller;

import com.novasalud.auth.SessionUser;
import com.novasalud.inicio.dto.InicioSummaryDto;
import com.novasalud.inicio.dto.InicioChartsDto;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.novasalud.inicio.service.InicioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inicio")
public class InicioController {

    private final InicioService inicioService;

    public InicioController(InicioService inicioService) {
        this.inicioService = inicioService;
    }

    @GetMapping
    public ResponseEntity<InicioSummaryDto> obtenerResumen(@AuthenticationPrincipal SessionUser user) {
        return ResponseEntity.ok(inicioService.obtenerResumen(user));
    }

    @GetMapping("/graficos")
    public ResponseEntity<InicioChartsDto> obtenerGraficos(@AuthenticationPrincipal SessionUser user,
        @RequestParam(defaultValue = "30") String days) {
        final int period;
        try {
            period = Integer.parseInt(days);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El período debe ser 7, 30 o 90 días");
        }
        return ResponseEntity.ok(inicioService.charts(user, period));
    }
}
