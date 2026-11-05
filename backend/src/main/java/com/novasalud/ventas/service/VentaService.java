package com.novasalud.ventas.service;

import com.novasalud.auth.PasswordService;
import com.novasalud.auth.model.Usuario;
import com.novasalud.auth.repository.UsuarioRepository;
import com.novasalud.catalogo.model.Producto;
import com.novasalud.catalogo.repository.ProductoRepository;
import com.novasalud.clientes.model.Cliente;
import com.novasalud.clientes.repository.ClienteRepository;
import com.novasalud.comprobantes.dto.ComprobanteResponseDto;
import com.novasalud.comprobantes.model.Comprobante;
import com.novasalud.comprobantes.service.ComprobanteService;
import com.novasalud.inventario.model.Lote;
import com.novasalud.inventario.model.Movimiento;
import com.novasalud.inventario.repository.LoteRepository;
import com.novasalud.inventario.repository.MovimientoRepository;
import com.novasalud.inventario.service.FefoService;
import com.novasalud.inventario.service.SerieUnidadService;
import jakarta.persistence.EntityManager;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.BusinessException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import com.novasalud.ventas.dto.*;
import com.novasalud.ventas.model.*;
import com.novasalud.ventas.repository.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import com.novasalud.shared.events.InventoryEvents;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VentaService {

    private final InventoryEvents inventoryEvents;

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final DetalleVentaLoteRepository detalleVentaLoteRepository;
    private final PagoRepository pagoRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final LoteRepository loteRepository;
    private final MovimientoRepository movimientoRepository;
    private final FefoService fefoService;
    private final ComprobanteService comprobanteService;
    private final SerieUnidadService series;
    private final EntityManager entityManager;

    public VentaService(
        VentaRepository ventaRepository,
        DetalleVentaRepository detalleVentaRepository,
        DetalleVentaLoteRepository detalleVentaLoteRepository,
        PagoRepository pagoRepository,
        ProductoRepository productoRepository,
        ClienteRepository clienteRepository,
        UsuarioRepository usuarioRepository,
        LoteRepository loteRepository,
        MovimientoRepository movimientoRepository,
        FefoService fefoService,
        ComprobanteService comprobanteService,
        SerieUnidadService series,
        EntityManager entityManager,
        InventoryEvents inventoryEvents
    ) {
        this.inventoryEvents = inventoryEvents;
        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.detalleVentaLoteRepository = detalleVentaLoteRepository;
        this.pagoRepository = pagoRepository;
        this.productoRepository = productoRepository;
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.loteRepository = loteRepository;
        this.movimientoRepository = movimientoRepository;
        this.fefoService = fefoService;
        this.comprobanteService = comprobanteService;
        this.series = series;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<VentaResponseDto> listar() {
        return ventaRepository.findAllByOrderByFechaDesc().stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public VentaResponseDto obtenerPorId(Long id) {
        return ventaRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada con ID: " + id));
    }

    /**
     * RF-23 / CA-01 / CA-02: Transacción ACID atómica de venta.
     * Si falla cualquier validación o descuento de lote, revierte por completo.
     */
    @Transactional(rollbackFor = Exception.class)
    public VentaResponseDto registrarVenta(CreateVentaDto dto, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

        Cliente cliente = null;
        if (dto.clienteId() != null) {
            cliente = clienteRepository.findById(dto.clienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + dto.clienteId()));
        }

        // Idempotencia
        UUID idempotenciaKey = dto.claveIdempotencia() != null && !dto.claveIdempotencia().isBlank()
            ? UUID.fromString(dto.claveIdempotencia().trim())
            : UUID.randomUUID();

        if (ventaRepository.findByClaveIdempotencia(idempotenciaKey).isPresent()) {
            return toDto(ventaRepository.findByClaveIdempotencia(idempotenciaKey).get());
        }

        String documentType=dto.tipoComprobante()==null?"BOLETA":dto.tipoComprobante().trim().toUpperCase();
        if ("FACTURA".equals(documentType) && (cliente==null || !"RUC".equals(cliente.getTipoDocumento())))
            throw new BusinessException("Para emitir factura selecciona un cliente con RUC.");
        if ("BOLETA".equals(documentType) && cliente!=null && "RUC".equals(cliente.getTipoDocumento()))
            throw new BusinessException("La boleta no admite un cliente con RUC.");
        if (!java.util.Set.of("BOLETA","FACTURA","NOTA_VENTA").contains(documentType))
            throw new BusinessException("Tipo de comprobante no válido.");
        if (dto.items().stream().map(ItemVentaDto::productoId).distinct().count()!=dto.items().size())
            throw new BusinessException("Agrupa cada producto en una sola línea.");
        productoRepository.lockForSale(dto.items().stream().map(ItemVentaDto::productoId).sorted().toList());

        // 1. Calcular totales preliminares
        BigDecimal subtotalAcum = BigDecimal.ZERO;
        BigDecimal impuestoAcum = BigDecimal.ZERO;
        BigDecimal totalAcum = BigDecimal.ZERO;

        record LineaCalculada(Producto producto, int cantidad, BigDecimal precioUnit, BigDecimal sub, BigDecimal imp, BigDecimal tot, List<Long> unidades) {}
        List<LineaCalculada> lineas = new ArrayList<>();

        for (ItemVentaDto item : dto.items()) {
            Producto producto = productoRepository.findById(item.productoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + item.productoId()));

            if (!producto.isActivo()) {
                throw new BusinessException("El producto '" + producto.getNombre() + "' no está activo.");
            }

            BigDecimal precioUnit = item.precioUnitario() != null ? item.precioUnitario() : producto.getPrecioVenta();
            BigDecimal totalLinea = precioUnit.multiply(BigDecimal.valueOf(item.cantidad())).setScale(2, RoundingMode.HALF_UP);
            BigDecimal subtotalLinea = totalLinea.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
            BigDecimal impuestoLinea = totalLinea.subtract(subtotalLinea);

            subtotalAcum = subtotalAcum.add(subtotalLinea);
            impuestoAcum = impuestoAcum.add(impuestoLinea);
            totalAcum = totalAcum.add(totalLinea);

            lineas.add(new LineaCalculada(producto, item.cantidad(), precioUnit, subtotalLinea, impuestoLinea, totalLinea,item.unidadesSerializadas()));
        }

        // RF-22: Verificar total pagado >= total de la venta
        BigDecimal totalPagado = dto.pagos().stream()
            .map(PagoDto::monto)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPagado.compareTo(totalAcum) < 0) {
            throw new BusinessException(
                "Monto pagado insuficiente. Total venta: S/ " + totalAcum + ", Monto pagado: S/ " + totalPagado
            );
        }

        // 2. Crear cabecera de Venta
        Venta venta = new Venta();
        venta.setCliente(cliente);
        venta.setUsuario(usuario);
        venta.setSubtotal(subtotalAcum);
        venta.setImpuesto(impuestoAcum);
        venta.setTotal(totalAcum);
        venta.setEstado("CONFIRMADA");
        venta.setClaveIdempotencia(idempotenciaKey);
        venta.setSolicitudHash(PasswordService.sha256(idempotenciaKey.toString() + usuarioId + totalAcum));

        Venta ventaGuardada = ventaRepository.save(venta);

        // 3. Procesar líneas y descontar lotes con FEFO (RF-13, RN-03 / CA-01)
        List<DetalleVenta> detallesGuardados = new ArrayList<>();

        for (LineaCalculada lin : lineas) {
            DetalleVenta det = new DetalleVenta();
            det.setVenta(ventaGuardada);
            det.setProducto(lin.producto());
            det.setDescripcion(lin.producto().getNombre());
            det.setCantidad(lin.cantidad());
            det.setPrecioUnitario(lin.precioUnit());
            det.setTasaImpuesto(new BigDecimal("0.1800"));
            det.setSubtotal(lin.sub());
            det.setImpuesto(lin.imp());
            det.setTotal(lin.tot());
            DetalleVenta detGuardado = detalleVentaRepository.save(det);

            // Asignación FEFO
            List<FefoService.AsignacionFefo> asignaciones = fefoService.asignarLotes(
                lin.producto().getId(),
                lin.producto().getNombre(),
                lin.cantidad()
            );

            List<DetalleVentaLote> asignacionesGuardadas = new ArrayList<>();
            for (FefoService.AsignacionFefo asig : asignaciones) {
                Lote lote = asig.lote();
                int cant = asig.cantidad();

                // Descontar existencias del lote
                lote.setStockActual(lote.getStockActual() - cant);
                loteRepository.save(lote);

                // Guardar desglose detalle_venta_lote
                DetalleVentaLote dvl = new DetalleVentaLote(detGuardado, lin.producto(), lote, cant);
                asignacionesGuardadas.add(detalleVentaLoteRepository.save(dvl));

                // RF-09 / RN-05: Movimiento de SALIDA auditable
                Movimiento mov = new Movimiento();
                mov.setLote(lote);
                mov.setUsuario(usuario);
                mov.setTipo("SALIDA");
                mov.setCantidad(-cant);
                mov.setMotivo("Venta #" + ventaGuardada.getId());
                mov.setReferencia("Venta #" + ventaGuardada.getId() + " - Lote " + lote.getNumeroLote());
                mov.setVentaId(ventaGuardada.getId());
                movimientoRepository.save(mov);
            }
            detGuardado.setAsignacionesLote(asignacionesGuardadas);
            entityManager.flush();
            series.asignar(lin.producto().getId(),lin.unidades(),lin.cantidad(),asignacionesGuardadas);
            detallesGuardados.add(detGuardado);
        }

        ventaGuardada.setDetalles(detallesGuardados);

        // 4. Guardar formas de pago
        List<Pago> pagosGuardados = new ArrayList<>();
        for (PagoDto p : dto.pagos()) {
            Pago pago = new Pago();
            pago.setVenta(ventaGuardada);
            pago.setMetodo(p.metodo().trim().toUpperCase());
            pago.setMonto(p.monto());
            pago.setReferencia(p.referencia() != null ? p.referencia().trim() : null);
            pagosGuardados.add(pagoRepository.save(pago));
        }
        ventaGuardada.setPagos(pagosGuardados);

        // 5. Emitir comprobante simulado (RF-25 a RF-28)
        comprobanteService.emitirComprobanteSimulado(ventaGuardada, dto.tipoComprobante());

        inventoryEvents.changed();
        return toDto(ventaGuardada);
    }

    /**
     * RF-24 / RN-09: Anular venta autorizada con compensación de inventario.
     */
    @Transactional(rollbackFor = Exception.class)
    public VentaResponseDto anularVenta(Long ventaId, AnularVentaDto dto, Long usuarioId) {
        Venta venta = ventaRepository.lockById(ventaId)
            .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada con ID: " + ventaId));

        if ("ANULADA".equals(venta.getEstado())) {
            throw new BusinessException("La venta ya se encuentra anulada.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        venta.setEstado("ANULADA");
        venta.setAnuladaPor(usuario);
        venta.setAnuladaEn(Instant.now());
        venta.setMotivoAnulacion(dto.motivo().trim());

        productoRepository.lockForSale(venta.getDetalles().stream().map(d->d.getProducto().getId()).distinct().sorted().toList());
        series.liberarVenta(ventaId);
        // Compensación de stock por lotes (revertir movimientos de salida)
        for (DetalleVenta det : venta.getDetalles()) {
            for (DetalleVentaLote dvl : det.getAsignacionesLote()) {
                Lote lote = dvl.getLote();
                int cantidad = dvl.getCantidad();

                // Devolver stock al lote
                lote.setStockActual(lote.getStockActual() + cantidad);
                loteRepository.save(lote);

                // Movimiento inverso auditable
                Movimiento mov = new Movimiento();
                mov.setLote(lote);
                mov.setUsuario(usuario);
                mov.setTipo("ENTRADA");
                mov.setCantidad(cantidad);
                mov.setMotivo("Compensación por anulación de Venta #" + venta.getId());
                mov.setReferencia("Anulación Venta #" + venta.getId() + " - Lote " + lote.getNumeroLote());
                mov.setVentaId(venta.getId());
                movimientoRepository.save(mov);
            }
        }

        // Anular comprobante asociado si existe
        try {
            ComprobanteResponseDto compDto = comprobanteService.obtenerPorVentaId(venta.getId());
            // actualizar estado a ANULADO
        } catch (Exception ignored) {}

        inventoryEvents.changed();
        return toDto(ventaRepository.save(venta));
    }

    private VentaResponseDto toDto(Venta v) {
        List<DetalleVentaResponseDto> detalles = v.getDetalles().stream().map(d -> {
            List<AsignacionLoteDto> lotes = d.getAsignacionesLote().stream()
                .map(a -> new AsignacionLoteDto(a.getLote().getId(), a.getLote().getNumeroLote(), a.getCantidad()))
                .toList();

            return new DetalleVentaResponseDto(
                d.getId(),
                d.getProducto().getId(),
                d.getProducto().getCodigo(),
                d.getDescripcion(),
                d.getCantidad(),
                d.getPrecioUnitario(),
                d.getSubtotal(),
                d.getImpuesto(),
                d.getTotal(),
                lotes,
                series.deDetalle(d.getId())
            );
        }).toList();

        List<PagoDto> pagos = v.getPagos().stream()
            .map(p -> new PagoDto(p.getMetodo(), p.getMonto(), p.getReferencia()))
            .toList();

        ComprobanteResponseDto comprobante = null;
        try {
            comprobante = comprobanteService.obtenerPorVentaId(v.getId());
        } catch (Exception ignored) {}

        return new VentaResponseDto(
            v.getId(),
            v.getCliente() != null ? v.getCliente().getId() : null,
            v.getCliente() != null ? v.getCliente().getNombre() : "CLIENTES VARIOS",
            v.getUsuario().getNombre(),
            v.getFecha(),
            v.getSubtotal(),
            v.getImpuesto(),
            v.getTotal(),
            v.getEstado(),
            detalles,
            pagos,
            comprobante
        );
    }
}
