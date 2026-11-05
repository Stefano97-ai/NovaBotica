package com.novasalud.catalogo.service;

import com.novasalud.catalogo.dto.CreateProductoDto;
import com.novasalud.catalogo.dto.ProductoDto;
import com.novasalud.catalogo.dto.UpdateProductoDto;
import com.novasalud.catalogo.model.Categoria;
import com.novasalud.catalogo.model.Producto;
import com.novasalud.catalogo.repository.CategoriaRepository;
import com.novasalud.catalogo.repository.ProductoRepository;
import com.novasalud.inventario.repository.LoteRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import com.novasalud.shared.events.InventoryEvents;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductoService {

    private final InventoryEvents inventoryEvents;

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final LoteRepository loteRepository;

    public ProductoService(
        ProductoRepository productoRepository,
        CategoriaRepository categoriaRepository,
        LoteRepository loteRepository,
        InventoryEvents inventoryEvents
    ) {
        this.inventoryEvents = inventoryEvents;
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.loteRepository = loteRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductoDto> listar(boolean soloActivos, String query, Long categoriaId) {
        List<Producto> productos;
        if (query != null && !query.trim().isBlank()) {
            productos = productoRepository.buscarPorNombreOCodigo(query.trim());
        } else if (categoriaId != null) {
            productos = productoRepository.findByCategoriaIdAndActivoTrue(categoriaId);
        } else if (soloActivos) {
            productos = productoRepository.findByActivoTrueOrderByNombreAsc();
        } else {
            productos = productoRepository.findAllByOrderByNombreAsc();
        }
        return productos.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProductoDto obtenerPorId(Long id) {
        return productoRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
    }

    @Transactional
    public ProductoDto crear(CreateProductoDto dto) {
        String codigo = dto.codigo().trim().toUpperCase();
        if (productoRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new BadRequestException("Ya existe un producto con el código: " + codigo);
        }
        Categoria categoria = categoriaRepository.findById(dto.categoriaId())
            .orElseThrow(() -> new BadRequestException("Categoría no encontrada con ID: " + dto.categoriaId()));

        Producto producto = new Producto();
        producto.setCodigo(codigo);
        producto.setNombre(dto.nombre().trim());
        producto.setCategoria(categoria);
        producto.setUnidadBase(dto.unidadBase() == null || dto.unidadBase().isBlank() ? "UNIDAD" : dto.unidadBase().trim());
        producto.setPrecioVenta(dto.precioVenta());
        producto.setStockMinimo(dto.stockMinimo() == null ? 0 : dto.stockMinimo());
        producto.setActivo(true);
        producto.setRequiereSerie(Boolean.TRUE.equals(dto.requiereSerie()));

        inventoryEvents.changed();
        return toDto(productoRepository.save(producto));
    }

    @Transactional
    public ProductoDto actualizar(Long id, UpdateProductoDto dto) {
        Producto producto = productoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));

        Categoria categoria = categoriaRepository.findById(dto.categoriaId())
            .orElseThrow(() -> new BadRequestException("Categoría no encontrada con ID: " + dto.categoriaId()));

        producto.setNombre(dto.nombre().trim());
        producto.setCategoria(categoria);
        if (dto.unidadBase() != null && !dto.unidadBase().isBlank()) {
            producto.setUnidadBase(dto.unidadBase().trim());
        }
        producto.setPrecioVenta(dto.precioVenta());
        if (dto.stockMinimo() != null) {
            producto.setStockMinimo(dto.stockMinimo());
        }
        if (dto.activo() != null) {
            producto.setActivo(dto.activo());
        }
        if (dto.requiereSerie() != null) producto.setRequiereSerie(dto.requiereSerie());

        inventoryEvents.changed();
        return toDto(productoRepository.save(producto));
    }

    @Transactional
    public ProductoDto cambiarEstado(Long id, boolean activo) {
        Producto producto = productoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
        producto.setActivo(activo);
        inventoryEvents.changed();
        return toDto(productoRepository.save(producto));
    }

    public ProductoDto toDto(Producto p) {
        Long stock = loteRepository.calcularStockDisponible(p.getId(), LocalDate.now(java.time.ZoneId.of("America/Lima")));
        return new ProductoDto(
            p.getId(),
            p.getCategoria().getId(),
            p.getCategoria().getNombre(),
            p.getCodigo(),
            p.getNombre(),
            p.getUnidadBase(),
            p.getPrecioVenta(),
            p.getStockMinimo(),
            stock == null ? 0L : stock,
            p.isActivo(),
            p.getCreadoEn(),
            p.isRequiereSerie(),
            p.getImagenVersion()==null?null:"/api/productos/"+p.getId()+"/imagen?v="+p.getImagenVersion()
        );
    }
}
