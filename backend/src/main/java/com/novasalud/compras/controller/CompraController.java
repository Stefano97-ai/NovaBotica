package com.novasalud.compras.controller;

import com.novasalud.auth.SessionUser;
import com.novasalud.compras.dto.CompraResponseDto;
import com.novasalud.compras.dto.CreateCompraDto;
import com.novasalud.compras.dto.RecepcionCompraDto;
import com.novasalud.compras.service.CompraService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compras")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO')")
public class CompraController {

    private final CompraService compraService;

    public CompraController(CompraService compraService) {
        this.compraService = compraService;
    }

    @GetMapping
    public ResponseEntity<List<CompraResponseDto>> listar() {
        return ResponseEntity.ok(compraService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompraResponseDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(compraService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<CompraResponseDto> crear(
        @Valid @RequestBody CreateCompraDto dto,
        @AuthenticationPrincipal SessionUser user
    ) {
        Long usuarioId = Long.parseLong(user.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(compraService.crear(dto, usuarioId));
    }

    @PostMapping("/{id}/recepcion")
    public ResponseEntity<CompraResponseDto> recepcionar(
        @PathVariable Long id,
        @Valid @RequestBody List<RecepcionCompraDto> recepciones,
        @AuthenticationPrincipal SessionUser user
    ) {
        Long usuarioId = Long.parseLong(user.id());
        return ResponseEntity.ok(compraService.recepcionarMercaderia(id, recepciones, usuarioId));
    }

    @PostMapping("/{id}/anular")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<CompraResponseDto> anular(@PathVariable Long id) {
        return ResponseEntity.ok(compraService.anular(id));
    }
}
