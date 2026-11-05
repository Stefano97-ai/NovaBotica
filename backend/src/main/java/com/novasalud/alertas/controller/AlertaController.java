package com.novasalud.alertas.controller;

import com.novasalud.alertas.dto.AlertasPageDto;
import com.novasalud.alertas.service.AlertaService;
import com.novasalud.auth.SessionUser;
import com.novasalud.shared.exception.BadRequestException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alertas")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','ALMACENERO','VENDEDOR')")
public class AlertaController {
    public record Lectura(@Min(1) int version) {}
    private final AlertaService service;
    public AlertaController(AlertaService service) { this.service=service; }
    @GetMapping
    public AlertasPageDto list(@AuthenticationPrincipal SessionUser user,
        @RequestParam(defaultValue="ACTIVA") String estado,@RequestParam(defaultValue="TODAS") String tipo,
        @RequestParam(defaultValue="TODAS") String prioridad,@RequestParam(defaultValue="false") String noLeidas,
        @RequestParam(defaultValue="25") String limit,@RequestParam(defaultValue="0") String offset) {
        if(!noLeidas.equals("true") && !noLeidas.equals("false")) throw new BadRequestException("Filtro de lectura inválido.");
        try { return service.list(user,estado,tipo,prioridad,Boolean.parseBoolean(noLeidas),Integer.parseInt(limit),Integer.parseInt(offset)); }
        catch(NumberFormatException e) {throw new BadRequestException("La paginación debe ser numérica.");}
    }
    @PutMapping("/{id}/lectura")
    public ResponseEntity<Void> read(@AuthenticationPrincipal SessionUser user,@PathVariable Long id,@Valid @RequestBody Lectura body) {
        service.read(user,id,body.version()); return ResponseEntity.noContent().build();
    }
    @PutMapping("/lecturas")
    public ResponseEntity<Void> readAll(@AuthenticationPrincipal SessionUser user) {
        service.readAll(user); return ResponseEntity.noContent().build();
    }
}
