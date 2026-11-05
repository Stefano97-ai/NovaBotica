package com.novasalud.reportes.controller;

import com.novasalud.reportes.dto.ReportesDto;
import com.novasalud.reportes.service.ReportesService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class ReportesController {

    private final ReportesService reportesService;
    private final com.novasalud.reportes.service.ReporteDetalleService detalleService;

    public ReportesController(ReportesService reportesService, com.novasalud.reportes.service.ReporteDetalleService detalleService) {
        this.reportesService = reportesService;
        this.detalleService = detalleService;
    }

    @GetMapping("/detalle")
    public java.util.Map<String,Object> detalle(@RequestParam String tipo,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate desde,
        @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return detalleService.detalle(tipo,desde,hasta);
    }

    @GetMapping("/ventas")
    public ResponseEntity<ReportesDto.ResumenVentasDto> reporteVentas(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(reportesService.reporteVentas(desde, hasta));
    }

    @GetMapping("/compras")
    public ResponseEntity<ReportesDto.ResumenComprasDto> reporteCompras(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(reportesService.reporteCompras(desde, hasta));
    }

    @GetMapping("/inventario")
    public ResponseEntity<ReportesDto.ResumenInventarioDto> reporteInventario() {
        return ResponseEntity.ok(reportesService.reporteInventario());
    }
}
