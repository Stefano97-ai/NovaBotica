package com.novasalud.ventas.controller;

import com.novasalud.auth.SessionUser;
import com.novasalud.ventas.dto.AnularVentaDto;
import com.novasalud.ventas.dto.CreateVentaDto;
import com.novasalud.ventas.dto.VentaResponseDto;
import com.novasalud.ventas.service.VentaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @GetMapping
    public ResponseEntity<List<VentaResponseDto>> listar() {
        return ResponseEntity.ok(ventaService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VentaResponseDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ventaService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','VENDEDOR')")
    public ResponseEntity<VentaResponseDto> registrar(
        @Valid @RequestBody CreateVentaDto dto,
        @AuthenticationPrincipal SessionUser user
    ) {
        Long usuarioId = Long.parseLong(user.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(ventaService.registrarVenta(dto, usuarioId));
    }

    @PostMapping("/{id}/anular")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<VentaResponseDto> anular(
        @PathVariable Long id,
        @Valid @RequestBody AnularVentaDto dto,
        @AuthenticationPrincipal SessionUser user
    ) {
        Long usuarioId = Long.parseLong(user.id());
        return ResponseEntity.ok(ventaService.anularVenta(id, dto, usuarioId));
    }
}
