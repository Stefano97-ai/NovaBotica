package com.novasalud.inventario.controller;

import com.novasalud.inventario.dto.*;
import com.novasalud.inventario.service.SerieUnidadService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/productos/{productoId}/series")
public class SerieUnidadController {
    private final SerieUnidadService service;
    public SerieUnidadController(SerieUnidadService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','VENDEDOR','ALMACENERO')")
    public List<SerieDisponibleDto> listar(@PathVariable Long productoId,@RequestParam(defaultValue="1") int cantidad) {
        return service.disponibles(productoId,cantidad);
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO')")
    public ResponseEntity<Map<String,Long>> registrar(@PathVariable Long productoId,@Valid @RequestBody CrearSerieDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id",service.registrar(productoId,dto)));
    }
}
