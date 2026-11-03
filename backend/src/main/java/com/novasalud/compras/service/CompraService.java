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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompraService {

    private final CompraRepository compraRepository;
    private final DetalleCompraRepository detalleCompraRepository;
    private final RecepcionLoteRepository recepcionLoteRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final LoteRepository loteRepository;
    private final MovimientoRepository movimientoRepository;

    public CompraService(
        CompraRepository compraRepository,
        DetalleCompraRepository detalleCompraRepository,
        RecepcionLoteRepository recepcionLoteRepository,
        ProveedorRepository proveedorRepository,
        ProductoRepository productoRepository,
        UsuarioRepository usuarioRepository,
        LoteRepository loteRepository,
        MovimientoRepository movimientoRepository
    ) {
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
