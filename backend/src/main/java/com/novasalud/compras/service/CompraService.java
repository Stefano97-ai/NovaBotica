package com.novasalud.compras.service;

import com.novasalud.auth.model.Usuario;
import com.novasalud.auth.repository.UsuarioRepository;
import com.novasalud.catalogo.model.Producto;
import com.novasalud.catalogo.repository.ProductoRepository;
import com.novasalud.compras.dto.*;
import com.novasalud.compras.model.Compra;
import com.novasalud.compras.model.DetalleCompra;
import com.novasalud.compras.model.RecepcionLote;
import com.novasalud.compras.repository.CompraRepository;
import com.novasalud.compras.repository.DetalleCompraRepository;
import com.novasalud.compras.repository.RecepcionLoteRepository;
import com.novasalud.inventario.model.Lote;
import com.novasalud.inventario.model.Movimiento;
import com.novasalud.inventario.service.SerieUnidadService;
import com.novasalud.inventario.dto.CrearSerieDto;
import com.novasalud.inventario.repository.LoteRepository;
import com.novasalud.inventario.repository.MovimientoRepository;
import com.novasalud.proveedores.model.Proveedor;
import com.novasalud.proveedores.repository.ProveedorRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.BusinessException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.HashSet;
import org.springframework.stereotype.Service;
import com.novasalud.shared.events.InventoryEvents;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompraService {

    private final InventoryEvents inventoryEvents;

    private final CompraRepository compraRepository;
    private final DetalleCompraRepository detalleCompraRepository;
    private final RecepcionLoteRepository recepcionLoteRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final LoteRepository loteRepository;
    private final MovimientoRepository movimientoRepository;
    private final SerieUnidadService seriesService;

    public CompraService(
        CompraRepository compraRepository,
        DetalleCompraRepository detalleCompraRepository,
        RecepcionLoteRepository recepcionLoteRepository,
        ProveedorRepository proveedorRepository,
        ProductoRepository productoRepository,
        UsuarioRepository usuarioRepository,
        LoteRepository loteRepository,
        MovimientoRepository movimientoRepository,
        InventoryEvents inventoryEvents,
        SerieUnidadService seriesService
    ) {
        this.inventoryEvents = inventoryEvents;
        this.seriesService = seriesService;
        this.compraRepository = compraRepository;
        this.detalleCompraRepository = detalleCompraRepository;
        this.recepcionLoteRepository = recepcionLoteRepository;
        this.proveedorRepository = proveedorRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.loteRepository = loteRepository;
        this.movimientoRepository = movimientoRepository;
    }

    @Transactional(readOnly = true)
    public List<CompraResponseDto> listar() {
        return compraRepository.findAllByOrderByFechaDesc().stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public CompraResponseDto registrar(RegistroCompraDto dto, Long usuarioId) {
        // Use the same lock order as sales to serialize stock and serial changes.
        var products = productoRepository.lockForSale(dto.items().stream().map(RegistroCompraDto.Linea::productoId).distinct().sorted().toList());
        var seen = new HashSet<String>();
        var productIds = new HashSet<Long>();
        for (var item : dto.items()) {
            if (!productIds.add(item.productoId())) throw new BusinessException("Agrega cada producto una sola vez a la compra.");
            var product = products.stream().filter(p -> p.getId().equals(item.productoId())).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
            if (!product.isActivo()) throw new BusinessException("No se puede comprar un producto inactivo.");
            loteRepository.findByProductoIdAndNumeroLote(item.productoId(), item.numeroLote().trim().toUpperCase()).ifPresent(lot -> {
                if (!lot.isDisponible() || !lot.getFechaVencimiento().equals(item.fechaVencimiento()))
                    throw new BusinessException("El lote existente no está disponible o tiene otra fecha de vencimiento.");
            });
            var serials = item.series() == null ? List.<String>of() : item.series();
            if (product.isRequiereSerie() && serials.size() != item.cantidad())
                throw new BusinessException("Registra una serie por cada unidad de '" + product.getNombre() + "'.");
            if (!product.isRequiereSerie() && !serials.isEmpty())
                throw new BusinessException("El producto no está configurado para usar series únicas.");
            for (String serial : serials) {
                if (serial == null || serial.isBlank() || serial.trim().length() > 160 || !seen.add(serial.trim()))
                    throw new BusinessException("Las series deben ser válidas y distintas en toda la compra.");
            }
        }
        var created = crear(new CreateCompraDto(dto.proveedorId(), dto.items().stream()
            .map(i -> new ItemCompraDto(i.productoId(), i.cantidad(), i.costoUnitario())).toList()), usuarioId);
        var receipts = new ArrayList<RecepcionCompraDto>();
        for (var item : dto.items()) {
            var detail = created.detalles().stream().filter(d -> d.productoId().equals(item.productoId())).findFirst().orElseThrow();
            receipts.add(new RecepcionCompraDto(detail.id(), item.numeroLote(), item.fechaVencimiento(), item.cantidad()));
        }
        var received = recepcionarMercaderia(created.id(), receipts, usuarioId);
        // JDBC serial registration must see the stock and receipt rows flushed by JPA.
        compraRepository.flush();
        for (var item : dto.items()) {
            var detail = received.detalles().stream().filter(d -> d.productoId().equals(item.productoId())).findFirst().orElseThrow();
            var lot = loteRepository.findByProductoIdAndNumeroLote(item.productoId(), item.numeroLote().trim().toUpperCase()).orElseThrow();
            for (String serial : item.series() == null ? List.<String>of() : item.series())
                seriesService.registrar(item.productoId(), new CrearSerieDto(lot.getId(), detail.id(), serial.trim(), null));
        }
        return received;
    }

    @Transactional(readOnly = true)
    public CompraResponseDto obtenerPorId(Long id) {
        return compraRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada con ID: " + id));
    }

    @Transactional
    public CompraResponseDto crear(CreateCompraDto dto, Long usuarioId) {
        Proveedor proveedor = proveedorRepository.findById(dto.proveedorId())
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado con ID: " + dto.proveedorId()));

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

        Compra compra = new Compra();
        compra.setProveedor(proveedor);
        compra.setUsuario(usuario);
        compra.setEstado("PENDIENTE");

        BigDecimal total = BigDecimal.ZERO;
        List<DetalleCompra> detalles = new ArrayList<>();

        for (ItemCompraDto item : dto.items()) {
            Producto producto = productoRepository.findById(item.productoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + item.productoId()));

            DetalleCompra det = new DetalleCompra();
            det.setCompra(compra);
            det.setProducto(producto);
            det.setCantidad(item.cantidad());
            det.setCostoUnitario(item.costoUnitario());

            BigDecimal sub = item.costoUnitario().multiply(BigDecimal.valueOf(item.cantidad()));
            total = total.add(sub);
            detalles.add(det);
        }

        compra.setTotal(total);
        compra.setDetalles(detalles);

        inventoryEvents.changed();
        return toDto(compraRepository.save(compra));
    }

    @Transactional
    public CompraResponseDto recepcionarMercaderia(Long compraId, List<RecepcionCompraDto> recepciones, Long usuarioId) {
        Compra compra = compraRepository.findById(compraId)
            .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada con ID: " + compraId));

        if ("ANULADA".equals(compra.getEstado())) {
            throw new BusinessException("No se puede recibir mercadería de una compra anulada.");
        }
        if ("RECIBIDA".equals(compra.getEstado())) {
            throw new BusinessException("La compra ya se encuentra recibida en su totalidad.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        for (RecepcionCompraDto rec : recepciones) {
            DetalleCompra detalle = detalleCompraRepository.findById(rec.detalleCompraId())
                .orElseThrow(() -> new ResourceNotFoundException("Detalle de compra no encontrado: " + rec.detalleCompraId()));

            if (!detalle.getCompra().getId().equals(compra.getId())) {
                throw new BadRequestException("El detalle no pertenece a la orden de compra indicada.");
            }

            int yaRecibido = recepcionLoteRepository.sumCantidadRecibidaByDetalleCompraId(detalle.getId());
            int pendiente = detalle.getCantidad() - yaRecibido;

            // RF-17: Evitar registrar una recepción superior a la cantidad pendiente de la compra
            if (rec.cantidadRecibida() > pendiente) {
                throw new BusinessException(
                    "Recepción excede cantidad pendiente para '" + detalle.getProducto().getNombre() +
                    "'. Solicitado: " + rec.cantidadRecibida() + ", Pendiente: " + pendiente
                );
            }

            // Crear o buscar lote
            String numeroLote = rec.numeroLote().trim().toUpperCase();
            Lote lote = loteRepository.findByProductoIdAndNumeroLote(detalle.getProducto().getId(), numeroLote)
                .orElseGet(() -> {
                    Lote nuevo = new Lote();
                    nuevo.setProducto(detalle.getProducto());
                    nuevo.setNumeroLote(numeroLote);
                    nuevo.setFechaIngreso(LocalDate.now());
                    nuevo.setFechaVencimiento(rec.fechaVencimiento());
                    nuevo.setStockActual(0);
                    nuevo.setDisponible(true);
                    return loteRepository.save(nuevo);
                });

            // Incrementar existencias del lote
            lote.setStockActual(lote.getStockActual() + rec.cantidadRecibida());
            loteRepository.save(lote);

            // Registrar recepción
            RecepcionLote recepcion = new RecepcionLote();
            recepcion.setDetalleCompra(detalle);
            recepcion.setProducto(detalle.getProducto());
            recepcion.setLote(lote);
            recepcion.setUsuario(usuario);
            recepcion.setCantidadRecibida(rec.cantidadRecibida());
            recepcion.setClaveIdempotencia(UUID.randomUUID());
            recepcion = recepcionLoteRepository.save(recepcion);

            // RF-09 / RN-05: Movimiento de ENTRADA
            Movimiento mov = new Movimiento();
            mov.setLote(lote);
            mov.setUsuario(usuario);
            mov.setTipo("ENTRADA");
            mov.setCantidad(rec.cantidadRecibida());
            mov.setMotivo("Recepción de compra #" + compra.getId());
            mov.setReferencia("Compra #" + compra.getId() + " - Lote " + lote.getNumeroLote());
            mov.setRecepcionLoteId(recepcion.getId());
            movimientoRepository.save(mov);
        }

        // RF-18: Actualizar estado de la compra (PENDIENTE, PARCIAL, RECIBIDA)
        int totalSolicitado = 0;
        int totalRecibido = 0;
        for (DetalleCompra d : compra.getDetalles()) {
            totalSolicitado += d.getCantidad();
            totalRecibido += recepcionLoteRepository.sumCantidadRecibidaByDetalleCompraId(d.getId());
        }

        if (totalRecibido >= totalSolicitado) {
            compra.setEstado("RECIBIDA");
        } else if (totalRecibido > 0) {
            compra.setEstado("PARCIAL");
        } else {
            compra.setEstado("PENDIENTE");
        }

        inventoryEvents.changed();
        return toDto(compraRepository.save(compra));
    }

    @Transactional
    public CompraResponseDto anular(Long id) {
        Compra compra = compraRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada con ID: " + id));

        if (!"PENDIENTE".equals(compra.getEstado())) {
            throw new BusinessException("Solo se pueden anular compras en estado PENDIENTE sin recepciones.");
        }

        compra.setEstado("ANULADA");
        inventoryEvents.changed();
        return toDto(compraRepository.save(compra));
    }

    private CompraResponseDto toDto(Compra c) {
        List<DetalleCompraResponseDto> detallesDto = c.getDetalles().stream().map(d -> {
            int recibido = recepcionLoteRepository.sumCantidadRecibidaByDetalleCompraId(d.getId());
            int pendiente = Math.max(0, d.getCantidad() - recibido);
            BigDecimal sub = d.getCostoUnitario().multiply(BigDecimal.valueOf(d.getCantidad()));
            return new DetalleCompraResponseDto(
                d.getId(),
                d.getProducto().getId(),
                d.getProducto().getCodigo(),
                d.getProducto().getNombre(),
                d.getCantidad(),
                d.getCostoUnitario(),
                sub,
                recibido,
                pendiente
            );
        }).toList();

        return new CompraResponseDto(
            c.getId(),
            c.getProveedor().getId(),
            c.getProveedor().getRuc(),
            c.getProveedor().getRazonSocial(),
            c.getUsuario().getNombre(),
            c.getFecha(),
            c.getTotal(),
            c.getEstado(),
            detallesDto
        );
    }
}
