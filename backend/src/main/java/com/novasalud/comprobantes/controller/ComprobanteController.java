package com.novasalud.comprobantes.controller;

import com.novasalud.comprobantes.dto.ComprobanteResponseDto;
import com.novasalud.comprobantes.dto.SerieResponseDto;
import com.novasalud.comprobantes.service.ComprobanteService;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comprobantes")
public class ComprobanteController {

    private final ComprobanteService comprobanteService;

    public ComprobanteController(ComprobanteService comprobanteService) {
        this.comprobanteService = comprobanteService;
    }

    @GetMapping
    public ResponseEntity<List<ComprobanteResponseDto>> listar(
            @RequestParam(required = false) String serie,
            @RequestParam(required = false) Long correlativo) {
        if ((serie != null && !serie.isBlank()) || correlativo != null) {
            return ResponseEntity.ok(comprobanteService.buscar(serie, correlativo));
        }
        return ResponseEntity.ok(comprobanteService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComprobanteResponseDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(comprobanteService.obtenerPorId(id));
    }

    @GetMapping("/venta/{ventaId}")
    public ResponseEntity<ComprobanteResponseDto> obtenerPorVenta(@PathVariable Long ventaId) {
        return ResponseEntity.ok(comprobanteService.obtenerPorVentaId(ventaId));
    }

    @GetMapping("/series")
    public ResponseEntity<List<SerieResponseDto>> series() {
        return ResponseEntity.ok(comprobanteService.listarSeries());
    }

    @PostMapping("/{id}/reintentar")
    public ResponseEntity<ComprobanteResponseDto> reintentar(@PathVariable Long id) {
        return ResponseEntity.ok(comprobanteService.reintentar(id));
    }

    @GetMapping(value = "/{id}/descargar", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> descargarSimulado(@PathVariable Long id) {
        String texto = comprobanteService.generarComprobanteTexto(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"comprobante_simulado_" + id + ".txt\"")
            .body(texto);
    }
}
