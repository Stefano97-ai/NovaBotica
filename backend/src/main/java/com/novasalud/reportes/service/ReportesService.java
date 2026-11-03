package com.novasalud.reportes.service;

import com.novasalud.catalogo.model.Producto;
import com.novasalud.catalogo.repository.ProductoRepository;
import com.novasalud.compras.model.Compra;
import com.novasalud.compras.repository.CompraRepository;
import com.novasalud.inventario.model.Lote;
import com.novasalud.inventario.repository.LoteRepository;
import com.novasalud.reportes.dto.ReportesDto;
import com.novasalud.ventas.model.Pago;
import com.novasalud.ventas.model.Venta;
import com.novasalud.ventas.repository.VentaRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportesService {

    private final VentaRepository ventaRepository;
    private final CompraRepository compraRepository;
    private final ProductoRepository productoRepository;
    private final LoteRepository loteRepository;

    public ReportesService(
        VentaRepository ventaRepository,
        CompraRepository compraRepository,
        ProductoRepository productoRepository,
        LoteRepository loteRepository
    ) {
        this.ventaRepository = ventaRepository;
        this.compraRepository = compraRepository;
        this.productoRepository = productoRepository;
        this.loteRepository = loteRepository;
    }

    @Transactional(readOnly = true)
    public ReportesDto.ResumenVentasDto reporteVentas(LocalDate desde, LocalDate hasta) {
        ZoneId zone = ZoneId.of("America/Lima");
        Instant inicio = desde != null ? desde.atStartOfDay(zone).toInstant() : LocalDate.now(zone).minusDays(30).atStartOfDay(zone).toInstant();
        Instant fin = hasta != null ? hasta.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1) : Instant.now();

        List<Venta> ventas = ventaRepository.findByFechaBetweenOrderByFechaDesc(inicio, fin);

        long operaciones = 0;
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal impuesto = BigDecimal.ZERO;
        Map<String, BigDecimal> porMetodo = new HashMap<>();

        for (Venta v : ventas) {
            if ("CONFIRMADA".equals(v.getEstado())) {
                operaciones++;
                total = total.add(v.getTotal());
                subtotal = subtotal.add(v.getSubtotal());
                impuesto = impuesto.add(v.getImpuesto());

                for (Pago p : v.getPagos()) {
                    porMetodo.put(p.getMetodo(), porMetodo.getOrDefault(p.getMetodo(), BigDecimal.ZERO).add(p.getMonto()));
                }
            }
        }

        return new ReportesDto.ResumenVentasDto(operaciones, total, subtotal, impuesto, porMetodo, ventas);
    }

    @Transactional(readOnly = true)
    public ReportesDto.ResumenComprasDto reporteCompras(LocalDate desde, LocalDate hasta) {
        ZoneId zone = ZoneId.of("America/Lima");
        Instant inicio = desde != null ? desde.atStartOfDay(zone).toInstant() : LocalDate.now(zone).minusDays(30).atStartOfDay(zone).toInstant();
        Instant fin = hasta != null ? hasta.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1) : Instant.now();

        List<Compra> compras = compraRepository.findByFechaBetweenOrderByFechaDesc(inicio, fin);

        long ordenes = compras.size();
        BigDecimal total = compras.stream()
            .filter(c -> !"ANULADA".equals(c.getEstado()))
            .map(Compra::getTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> porEstado = compras.stream()
            .collect(Collectors.groupingBy(Compra::getEstado, Collectors.counting()));

        return new ReportesDto.ResumenComprasDto(ordenes, total, porEstado, compras);
    }

    @Transactional(readOnly = true)
    public ReportesDto.ResumenInventarioDto reporteInventario() {
        LocalDate hoy = LocalDate.now();
        List<Producto> productos = productoRepository.findByActivoTrueOrderByNombreAsc();
        List<Lote> todosLotes = loteRepository.findAll();

        long totalProds = productos.size();
        long lotesActivos = todosLotes.stream().filter(Lote::isDisponible).count();
        long totalUnidades = todosLotes.stream().filter(Lote::isDisponible).mapToLong(Lote::getStockActual).sum();

        long bajoStock = 0;
        for (Producto p : productos) {
            Long s = loteRepository.calcularStockDisponible(p.getId(), hoy);
            if ((s != null ? s : 0L) <= p.getStockMinimo()) {
                bajoStock++;
            }
        }

        long vencidos = loteRepository.findLotesVencidosConStock(hoy).size();
        long porVencer = loteRepository.findLotesProximosAVencer(hoy, hoy.plusDays(30)).size();

        return new ReportesDto.ResumenInventarioDto(totalProds, lotesActivos, totalUnidades, bajoStock, vencidos, porVencer);
    }
}
