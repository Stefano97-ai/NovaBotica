package com.novasalud.ventas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.novasalud.catalogo.model.Producto;
import com.novasalud.inventario.model.Lote;
import jakarta.persistence.*;

@Entity
@Table(name = "detalle_venta_lote", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"detalle_venta_id", "lote_id"})
})
public class DetalleVentaLote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "detalle_venta_id", nullable = false)
    @JsonIgnore
    private DetalleVenta detalleVenta;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "lote_id", nullable = false)
    private Lote lote;

    @Column(nullable = false)
    private Integer cantidad;

    public DetalleVentaLote() {}

    public DetalleVentaLote(DetalleVenta detalleVenta, Producto producto, Lote lote, Integer cantidad) {
        this.detalleVenta = detalleVenta;
        this.producto = producto;
        this.lote = lote;
        this.cantidad = cantidad;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DetalleVenta getDetalleVenta() {
        return detalleVenta;
    }

    public void setDetalleVenta(DetalleVenta detalleVenta) {
        this.detalleVenta = detalleVenta;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Lote getLote() {
        return lote;
    }

    public void setLote(Lote lote) {
        this.lote = lote;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
}
