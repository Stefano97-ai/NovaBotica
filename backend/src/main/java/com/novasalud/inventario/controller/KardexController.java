package com.novasalud.inventario.controller;

import com.novasalud.inventario.dto.*;
import com.novasalud.inventario.service.KardexService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventario/kardex")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO','VENDEDOR')")
public class KardexController {
    private final KardexService service;
    public KardexController(KardexService service) { this.service=service; }
    @GetMapping public KardexPageDto list(@Valid @ModelAttribute KardexQuery query) { return service.list(query); }
    @GetMapping("/opciones") public Map<String,Object> options() { return service.options(); }
    @GetMapping("/datos-exportacion") public java.util.List<KardexRowDto> exportRows(@Valid @ModelAttribute KardexQuery query) { return service.exportRows(query); }
    @GetMapping(value="/exportar",produces="text/csv;charset=UTF-8")
    public ResponseEntity<String> export(@Valid @ModelAttribute KardexQuery query) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\"kardex.csv\"").body(service.export(query));
    }
}
