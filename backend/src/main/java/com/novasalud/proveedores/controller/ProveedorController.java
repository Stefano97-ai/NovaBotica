package com.novasalud.proveedores.controller;

import com.novasalud.proveedores.dto.CreateProveedorDto;
import com.novasalud.proveedores.dto.ProveedorDto;
import com.novasalud.proveedores.dto.UpdateProveedorDto;
import com.novasalud.proveedores.service.ProveedorService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proveedores")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping
    public ResponseEntity<List<ProveedorDto>> listar(
        @RequestParam(required = false, defaultValue = "false") boolean soloActivos,
        @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(proveedorService.listar(soloActivos, query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProveedorDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(proveedorService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO')")
    public ResponseEntity<ProveedorDto> crear(@Valid @RequestBody CreateProveedorDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(proveedorService.crear(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO')")
    public ResponseEntity<ProveedorDto> actualizar(@PathVariable Long id, @Valid @RequestBody UpdateProveedorDto dto) {
        return ResponseEntity.ok(proveedorService.actualizar(id, dto));
    }

    @PatchMapping("/{id}/activo")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ProveedorDto> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        boolean activo = body.getOrDefault("activo", true);
        return ResponseEntity.ok(proveedorService.cambiarEstado(id, activo));
    }
}
