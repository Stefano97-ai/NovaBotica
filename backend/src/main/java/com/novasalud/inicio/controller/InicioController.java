package com.novasalud.inicio.controller;

import com.novasalud.auth.SessionUser;
import com.novasalud.inicio.dto.InicioSummaryDto;
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
}
