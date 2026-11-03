package com.novasalud.catalogo.controller;

import com.novasalud.catalogo.dto.CreateProductoDto;
import com.novasalud.catalogo.dto.ProductoDto;
import com.novasalud.catalogo.dto.UpdateProductoDto;
import com.novasalud.catalogo.service.ProductoService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public ResponseEntity<List<ProductoDto>> listar(
        @RequestParam(required = false, defaultValue = "false") boolean soloActivos,
        @RequestParam(required = false) String query,
        @RequestParam(required = false) Long categoriaId
    ) {
        return ResponseEntity.ok(productoService.listar(soloActivos, query, categoriaId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO')")
    public ResponseEntity<ProductoDto> crear(@Valid @RequestBody CreateProductoDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ProductoDto> actualizar(@PathVariable Long id, @Valid @RequestBody UpdateProductoDto dto) {
        return ResponseEntity.ok(productoService.actualizar(id, dto));
    }

    @PatchMapping("/{id}/activo")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ProductoDto> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        boolean activo = body.getOrDefault("activo", true);
        return ResponseEntity.ok(productoService.cambiarEstado(id, activo));
    }
}
