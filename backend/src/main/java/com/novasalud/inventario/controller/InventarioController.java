package com.novasalud.inventario.controller;

import com.novasalud.auth.SessionUser;
import com.novasalud.inventario.dto.*;
import com.novasalud.inventario.service.InventarioService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    private final InventarioService inventarioService;

    public InventarioController(InventarioService inventarioService) {
        this.inventarioService = inventarioService;
    }

    @GetMapping("/lotes")
    public ResponseEntity<List<LoteDto>> listarLotes(@RequestParam(required = false) Long productoId) {
        return ResponseEntity.ok(inventarioService.listarLotes(productoId));
    }

    @GetMapping("/lotes/{id}")
    public ResponseEntity<LoteDto> obtenerLote(@PathVariable Long id) {
        return ResponseEntity.ok(inventarioService.obtenerLotePorId(id));
    }

    @PostMapping("/lotes")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO')")
    public ResponseEntity<LoteDto> crearLote(
        @Valid @RequestBody CreateLoteDto dto,
        @AuthenticationPrincipal SessionUser user
    ) {
        Long usuarioId = Long.parseLong(user.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(inventarioService.crearLote(dto, usuarioId));
    }

    @PostMapping("/ajuste")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO')")
    public ResponseEntity<?> registrarAjuste(
        @Valid @RequestBody AjusteStockDto dto,
        @AuthenticationPrincipal SessionUser user
    ) {
        Long usuarioId = Long.parseLong(user.id());
        inventarioService.registrarAjuste(dto, usuarioId);
        return ResponseEntity.ok(Map.of("message", "Ajuste de inventario registrado exitosamente"));
    }

    @GetMapping("/movimientos")
    public ResponseEntity<List<MovimientoDto>> listarMovimientos(
        @RequestParam(required = false) Long loteId,
        @RequestParam(required = false) Long productoId
    ) {
        return ResponseEntity.ok(inventarioService.listarMovimientos(loteId, productoId));
    }

    @GetMapping("/alertas/stock")
    public ResponseEntity<List<AlertaStockDto>> alertasStock() {
        return ResponseEntity.ok(inventarioService.obtenerAlertasStock());
    }

    @GetMapping("/alertas/vencimientos")
    public ResponseEntity<List<AlertaVencimientoDto>> alertasVencimiento(
        @RequestParam(required = false, defaultValue = "30") int dias
    ) {
        return ResponseEntity.ok(inventarioService.obtenerAlertasVencimiento(dias));
    }
}
