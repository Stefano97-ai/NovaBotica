package com.novasalud.comprobantes.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novasalud.comprobantes.dto.ComprobanteResponseDto;
import com.novasalud.comprobantes.dto.SerieResponseDto;
import com.novasalud.comprobantes.model.Comprobante;
import com.novasalud.comprobantes.model.SerieComprobante;
import com.novasalud.comprobantes.repository.ComprobanteRepository;
import com.novasalud.comprobantes.repository.SerieComprobanteRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import com.novasalud.ventas.model.DetalleVenta;
import com.novasalud.ventas.model.Venta;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComprobanteService {

    private final ComprobanteRepository comprobanteRepository;
    private final SerieComprobanteRepository serieComprobanteRepository;
    private final ObjectMapper objectMapper;

    public ComprobanteService(
        ComprobanteRepository comprobanteRepository,
        SerieComprobanteRepository serieComprobanteRepository,
        ObjectMapper objectMapper
    ) {
        this.comprobanteRepository = comprobanteRepository;
        this.serieComprobanteRepository = serieComprobanteRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<ComprobanteResponseDto> listar() {
        return comprobanteRepository.findAllByOrderByCreadoEnDesc().stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ComprobanteResponseDto> buscar(String serie, Long correlativo) {
        return comprobanteRepository.findAllByOrderByCreadoEnDesc().stream()
            .filter(c -> {
                // Si se especifica número, buscar por correlativo, por ID de venta o por ID de comprobante
                if (correlativo != null) {
                    boolean matchCorrelativo = c.getCorrelativo() != null && c.getCorrelativo().equals(correlativo);
                    boolean matchVentaId = c.getVenta() != null && c.getVenta().getId() != null && c.getVenta().getId().equals(correlativo);
                    boolean matchComprobanteId = c.getId() != null && c.getId().equals(correlativo);
                    if (!matchCorrelativo && !matchVentaId && !matchComprobanteId) {
                        return false;
                    }
                }
                // Si se especifica serie y no coincidió directamente por ID de venta o comprobante, validar serie
                if (serie != null && !serie.isBlank()) {
                    boolean matchIdDirecto = correlativo != null && (
                        (c.getVenta() != null && c.getVenta().getId() != null && c.getVenta().getId().equals(correlativo)) ||
                        (c.getId() != null && c.getId().equals(correlativo))
                    );
                    if (!matchIdDirecto && c.getSerieComprobante() != null && c.getSerieComprobante().getSerie() != null) {
                        boolean matchSerie = c.getSerieComprobante().getSerie().equalsIgnoreCase(serie.trim());
                        if (!matchSerie) {
                            return false;
                        }
                    }
                }
                return true;
            })
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public ComprobanteResponseDto obtenerPorId(Long id) {
        return comprobanteRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Comprobante no encontrado con ID: " + id));
    }

    @Transactional(readOnly = true)
    public ComprobanteResponseDto obtenerPorVentaId(Long ventaId) {
        return comprobanteRepository.findByVentaId(ventaId)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Comprobante no encontrado para venta ID: " + ventaId));
    }

    @Transactional(readOnly = true)
    public List<SerieResponseDto> listarSeries() {
        return serieComprobanteRepository.findByActivoTrue().stream()
            .map(s -> new SerieResponseDto(
                s.getId(),
                s.getTipoComprobante().getCodigo(),
                s.getTipoComprobante().getNombre(),
                s.getSerie(),
                s.getUltimoCorrelativo(),
                s.isActivo()
            ))
            .toList();
    }

    @Transactional
    public Comprobante emitirComprobanteSimulado(Venta venta, String tipoCodigo) {
        String tipo = (tipoCodigo == null || tipoCodigo.isBlank()) ? "BOLETA" : tipoCodigo.trim().toUpperCase();

        SerieComprobante serie = serieComprobanteRepository.findFirstByTipoCodigo(tipo)
            .orElseThrow(() -> new BadRequestException("No hay serie activa configurada para el tipo: " + tipo));

        // Incrementar correlativo único dentro de la serie (RN-08)
        long nuevoCorrelativo = serie.getUltimoCorrelativo() + 1;
        serie.setUltimoCorrelativo(nuevoCorrelativo);
        serieComprobanteRepository.save(serie);

        // Construir JSON del documento simulado
        Map<String, Object> doc = new HashMap<>();
        doc.put("leyenda", "DOCUMENTO DE DEMOSTRACIÓN - SIN VALIDEZ TRIBUTARIA");
        doc.put("botica", "NOVA SALUD");
        doc.put("tipo", serie.getTipoComprobante().getNombre());
        doc.put("serie", serie.getSerie());
        doc.put("correlativo", nuevoCorrelativo);
        doc.put("numeroCompleto", String.format("%s-%08d", serie.getSerie(), nuevoCorrelativo));
        doc.put("fecha", venta.getFecha().toString());
        String tipoDoc = "DNI";
        String numDoc = "00000000";
        String nomCliente = "CLIENTES VARIOS";
        if (venta.getCliente() != null) {
            tipoDoc = venta.getCliente().getTipoDocumento() != null ? venta.getCliente().getTipoDocumento() : "DNI";
            numDoc = venta.getCliente().getNumeroDocumento() != null ? venta.getCliente().getNumeroDocumento() : "00000000";
            nomCliente = venta.getCliente().getNombre() != null ? venta.getCliente().getNombre() : "CLIENTES VARIOS";
        }
        doc.put("cliente", Map.of(
            "tipoDocumento", tipoDoc,
            "numeroDocumento", numDoc,
            "nombre", nomCliente
        ));
        doc.put("vendedor", venta.getUsuario().getNombre());
        doc.put("subtotal", venta.getSubtotal());
        doc.put("impuesto", venta.getImpuesto());
        doc.put("total", venta.getTotal());

        List<Map<String, Object>> items = venta.getDetalles().stream().map(d -> {
            Map<String, Object> item = new HashMap<>();
            item.put("producto", d.getDescripcion());
            item.put("cantidad", d.getCantidad());
            item.put("precioUnitario", d.getPrecioUnitario());
            item.put("total", d.getTotal());
            return item;
        }).toList();
        doc.put("items", items);

        String jsonString;
        try {
            jsonString = objectMapper.writeValueAsString(doc);
        } catch (Exception e) {
            jsonString = "{}";
        }

        Comprobante comprobante = new Comprobante();
        comprobante.setVenta(venta);
        comprobante.setSerieComprobante(serie);
        comprobante.setCorrelativo(nuevoCorrelativo);
        comprobante.setEstado("GENERADO");
        comprobante.setSimulado(true);
        comprobante.setDatosDocumento(jsonString);
        comprobante.setIntentos(1);

        return comprobanteRepository.save(comprobante);
    }

    @Transactional
    public ComprobanteResponseDto reintentar(Long id) {
        Comprobante comprobante = comprobanteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comprobante no encontrado con ID: " + id));

        comprobante.setIntentos(comprobante.getIntentos() + 1);
        comprobante.setEstado("GENERADO");
        comprobante.setUltimoError(null);

        return toDto(comprobanteRepository.save(comprobante));
    }

    @Transactional(readOnly = true)
    public String generarComprobanteTexto(Long id) {
        Comprobante c = comprobanteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comprobante no encontrado con ID: " + id));

        Venta v = c.getVenta();
        StringBuilder sb = new StringBuilder();
        sb.append("=========================================\n");
        sb.append("               NOVA SALUD               \n");
        sb.append("   SISTEMA DE GESTIÓN FARMACÉUTICA      \n");
        sb.append("=========================================\n");
        sb.append("*** DEMOSTRACIÓN - SIN VALIDEZ TRIBUTARIA ***\n\n");
        sb.append(c.getSerieComprobante().getTipoComprobante().getNombre().toUpperCase()).append("\n");
        sb.append(String.format("Número: %s-%08d\n", c.getSerieComprobante().getSerie(), c.getCorrelativo()));
        sb.append("Fecha: ").append(v.getFecha()).append("\n");
        sb.append("Atendido por: ").append(v.getUsuario().getNombre()).append("\n");
        sb.append("Cliente: ").append(v.getCliente() != null ? v.getCliente().getNombre() : "CLIENTES VARIOS").append("\n");
        if (v.getCliente() != null) {
            sb.append(v.getCliente().getTipoDocumento()).append(": ").append(v.getCliente().getNumeroDocumento()).append("\n");
        }
        sb.append("-----------------------------------------\n");
        sb.append(String.format("%-20s %4s %7s %7s\n", "PRODUCTO", "CANT", "P.UNIT", "TOTAL"));
        sb.append("-----------------------------------------\n");
        for (DetalleVenta d : v.getDetalles()) {
            String name = d.getDescripcion().length() > 19 ? d.getDescripcion().substring(0, 19) : d.getDescripcion();
            sb.append(String.format("%-20s %4d %7.2f %7.2f\n", name, d.getCantidad(), d.getPrecioUnitario(), d.getTotal()));
        }
        sb.append("-----------------------------------------\n");
        sb.append(String.format("Subtotal:  S/ %10.2f\n", v.getSubtotal()));
        sb.append(String.format("IGV (18%%): S/ %10.2f\n", v.getImpuesto()));
        sb.append(String.format("TOTAL:     S/ %10.2f\n", v.getTotal()));
        sb.append("=========================================\n");
        sb.append(" ¡Gracias por confiar en Nova Salud!    \n");
        sb.append("=========================================\n");

        return sb.toString();
    }

    private ComprobanteResponseDto toDto(Comprobante c) {
        String num = String.format("%s-%08d", c.getSerieComprobante().getSerie(), c.getCorrelativo());
        String clienteTipoDoc = "DNI";
        String clienteNumeroDoc = "00000000";
        String clienteNombre = "CLIENTES VARIOS";
        Double total = 0.0;

        if (c.getVenta() != null) {
            if (c.getVenta().getTotal() != null) {
                total = c.getVenta().getTotal().doubleValue();
            }
            if (c.getVenta().getCliente() != null) {
                if (c.getVenta().getCliente().getTipoDocumento() != null) {
                    clienteTipoDoc = c.getVenta().getCliente().getTipoDocumento();
                }
                if (c.getVenta().getCliente().getNumeroDocumento() != null) {
                    clienteNumeroDoc = c.getVenta().getCliente().getNumeroDocumento();
                }
                if (c.getVenta().getCliente().getNombre() != null) {
                    clienteNombre = c.getVenta().getCliente().getNombre();
                }
            }
        }

        return new ComprobanteResponseDto(
            c.getId(),
            c.getVenta() != null ? c.getVenta().getId() : null,
            c.getSerieComprobante().getTipoComprobante().getCodigo(),
            c.getSerieComprobante().getTipoComprobante().getNombre(),
            c.getSerieComprobante().getSerie(),
            c.getCorrelativo(),
            num,
            c.getEstado(),
            c.isSimulado(),
            clienteTipoDoc,
            clienteNumeroDoc,
            clienteNombre,
            total,
            c.getDatosDocumento(),
            c.getCreadoEn()
        );
    }
}
