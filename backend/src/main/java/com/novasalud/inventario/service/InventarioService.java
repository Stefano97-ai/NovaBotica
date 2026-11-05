package com.novasalud.inventario.service;

import com.novasalud.auth.model.Usuario;
import com.novasalud.auth.repository.UsuarioRepository;
import com.novasalud.catalogo.model.Producto;
import com.novasalud.catalogo.repository.ProductoRepository;
import com.novasalud.inventario.dto.*;
import com.novasalud.inventario.model.Lote;
import com.novasalud.inventario.model.Movimiento;
import com.novasalud.inventario.repository.LoteRepository;
import com.novasalud.inventario.repository.MovimientoRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import com.novasalud.shared.events.InventoryEvents;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventarioService {

    private final InventoryEvents inventoryEvents;

    private final LoteRepository loteRepository;
    private final MovimientoRepository movimientoRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    public InventarioService(
        LoteRepository loteRepository,
        MovimientoRepository movimientoRepository,
        ProductoRepository productoRepository,
        UsuarioRepository usuarioRepository,
        InventoryEvents inventoryEvents
    ) {
        this.inventoryEvents = inventoryEvents;
        this.loteRepository = loteRepository;
        this.movimientoRepository = movimientoRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<LoteDto> listarLotes(Long productoId) {
        List<Lote> lotes = productoId != null
            ? loteRepository.findByProductoIdOrderByFechaVencimientoAsc(productoId)
            : loteRepository.findAll();
        return lotes.stream().map(this::toLoteDto).toList();
    }

    @Transactional(readOnly = true)
    public LoteDto obtenerLotePorId(Long id) {
        return loteRepository.findById(id)
            .map(this::toLoteDto)
            .orElseThrow(() -> new ResourceNotFoundException("Lote no encontrado con ID: " + id));
    }

    @Transactional
    public LoteDto crearLote(CreateLoteDto dto, Long usuarioId) {
        Producto producto = productoRepository.findById(dto.productoId())
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + dto.productoId()));

        String numero = dto.numeroLote().trim().toUpperCase();
        if (loteRepository.findByProductoIdAndNumeroLote(producto.getId(), numero).isPresent()) {
            throw new BadRequestException("Ya existe el lote '" + numero + "' para el producto '" + producto.getNombre() + "'");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Lote lote = new Lote();
        lote.setProducto(producto);
        lote.setNumeroLote(numero);
        lote.setFechaIngreso(dto.fechaIngreso() != null ? dto.fechaIngreso() : LocalDate.now());
        lote.setFechaVencimiento(dto.fechaVencimiento());
        lote.setStockActual(dto.stockActual());
        lote.setDisponible(true);

        Lote guardado = loteRepository.save(lote);

        if (guardado.getStockActual() > 0) {
            Movimiento mov = new Movimiento();
            mov.setLote(guardado);
            mov.setUsuario(usuario);
            mov.setTipo("ENTRADA");
            mov.setCantidad(guardado.getStockActual());
            mov.setMotivo("Registro inicial de lote");
            mov.setReferencia("Lote " + guardado.getNumeroLote());
            movimientoRepository.save(mov);
        }

        inventoryEvents.changed();
        return toLoteDto(guardado);
    }

    @Transactional
    public void registrarAjuste(AjusteStockDto dto, Long usuarioId) {
        Lote lote = loteRepository.findById(dto.loteId())
            .orElseThrow(() -> new ResourceNotFoundException("Lote no encontrado con ID: " + dto.loteId()));

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        int nuevoStock = lote.getStockActual() + dto.cantidad();
        if (nuevoStock < 0) {
            throw new BadRequestException("El ajuste no puede dejar el stock del lote en negativo. Stock actual: " + lote.getStockActual());
        }

        lote.setStockActual(nuevoStock);
        loteRepository.save(lote);

        Movimiento mov = new Movimiento();
        mov.setLote(lote);
        mov.setUsuario(usuario);
        mov.setTipo("AJUSTE");
        mov.setCantidad(dto.cantidad());
        mov.setMotivo(dto.motivo().trim());
        mov.setReferencia(dto.referencia().trim());
        movimientoRepository.save(mov);
        inventoryEvents.changed();
    }

    @Transactional(readOnly = true)
    public List<MovimientoDto> listarMovimientos(Long loteId, Long productoId) {
        List<Movimiento> movimientos;
        if (loteId != null) {
            movimientos = movimientoRepository.findByLoteIdOrderByFechaDesc(loteId);
        } else if (productoId != null) {
            movimientos = movimientoRepository.findByLoteProductoIdOrderByFechaDesc(productoId);
        } else {
            movimientos = movimientoRepository.findAllByOrderByFechaDesc();
        }
        return movimientos.stream().map(this::toMovimientoDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaStockDto> obtenerAlertasStock() {
        LocalDate hoy = LocalDate.now();
        List<Producto> productos = productoRepository.findByActivoTrueOrderByNombreAsc();
        List<AlertaStockDto> alertas = new ArrayList<>();

        for (Producto p : productos) {
            Long stock = loteRepository.calcularStockDisponible(p.getId(), hoy);
            long actual = stock != null ? stock : 0L;
            if (actual <= p.getStockMinimo()) {
                String nivel = actual == 0 ? "CRITICO" : "BAJO";
                alertas.add(new AlertaStockDto(p.getId(), p.getCodigo(), p.getNombre(), actual, p.getStockMinimo(), nivel));
            }
        }
        return alertas;
    }

    @Transactional(readOnly = true)
    public List<AlertaVencimientoDto> obtenerAlertasVencimiento(int diasVentana) {
        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(diasVentana <= 0 ? 30 : diasVentana);
        List<AlertaVencimientoDto> resultado = new ArrayList<>();

        // Vencidos con stock
        List<Lote> vencidos = loteRepository.findLotesVencidosConStock(hoy);
        for (Lote l : vencidos) {
            long dias = ChronoUnit.DAYS.between(hoy, l.getFechaVencimiento());
            resultado.add(new AlertaVencimientoDto(
                l.getId(),
                l.getProducto().getId(),
                l.getProducto().getNombre(),
                l.getNumeroLote(),
                l.getStockActual(),
                l.getFechaVencimiento(),
                dias,
                "VENCIDO"
            ));
        }

        // Próximos a vencer
        List<Lote> proximos = loteRepository.findLotesProximosAVencer(hoy, limite);
        for (Lote l : proximos) {
            long dias = ChronoUnit.DAYS.between(hoy, l.getFechaVencimiento());
            resultado.add(new AlertaVencimientoDto(
                l.getId(),
                l.getProducto().getId(),
                l.getProducto().getNombre(),
                l.getNumeroLote(),
                l.getStockActual(),
                l.getFechaVencimiento(),
                dias,
                "POR_VENCER"
            ));
        }

        return resultado;
    }

    private LoteDto toLoteDto(Lote l) {
        return new LoteDto(
            l.getId(),
            l.getProducto().getId(),
            l.getProducto().getCodigo(),
            l.getProducto().getNombre(),
            l.getNumeroLote(),
            l.getFechaIngreso(),
            l.getFechaVencimiento(),
            l.getStockActual(),
            l.isDisponible(),
            l.estaVencido()
        );
    }

    private MovimientoDto toMovimientoDto(Movimiento m) {
        return new MovimientoDto(
            m.getId(),
            m.getLote().getId(),
            m.getLote().getProducto().getNombre(),
            m.getLote().getNumeroLote(),
            m.getUsuario().getNombre(),
            m.getFecha(),
            m.getTipo(),
            m.getCantidad(),
            m.getMotivo(),
            m.getReferencia(),
            m.getVentaId(),
            m.getRecepcionLoteId(),
            m.getSaldoAnterior(),
            m.getSaldoPosterior(),
            m.getOrigenTipo(),
            m.getOrigenId()
        );
    }
}
