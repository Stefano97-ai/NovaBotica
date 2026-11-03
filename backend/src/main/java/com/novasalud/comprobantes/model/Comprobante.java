package com.novasalud.comprobantes.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.novasalud.ventas.model.Venta;
import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "comprobante", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"serie_comprobante_id", "correlativo"})
})
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "venta_id", nullable = false, unique = true)
    @JsonIgnore
    private Venta venta;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "serie_comprobante_id", nullable = false)
    private SerieComprobante serieComprobante;

    @Column(nullable = false)
    private Long correlativo;

    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE"; // PENDIENTE, GENERADO, ERROR, ANULADO

    @Column(nullable = false)
    private boolean simulado = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos_documento", nullable = false, columnDefinition = "jsonb")
    private String datosDocumento;

    @Column(nullable = false)
    private Integer intentos = 0;

    @Column(name = "ultimo_error")
    private String ultimoError;

    @Column(name = "pdf_ruta")
    private String pdfRuta;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn = Instant.now();

    public Comprobante() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Venta getVenta() {
        return venta;
    }

    public void setVenta(Venta venta) {
        this.venta = venta;
    }

    public SerieComprobante getSerieComprobante() {
        return serieComprobante;
    }

    public void setSerieComprobante(SerieComprobante serieComprobante) {
        this.serieComprobante = serieComprobante;
    }

    public Long getCorrelativo() {
        return correlativo;
    }

    public void setCorrelativo(Long correlativo) {
        this.correlativo = correlativo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public boolean isSimulado() {
        return simulado;
    }

    public void setSimulado(boolean simulado) {
        this.simulado = simulado;
    }

    public String getDatosDocumento() {
        return datosDocumento;
    }

    public void setDatosDocumento(String datosDocumento) {
        this.datosDocumento = datosDocumento;
    }

    public Integer getIntentos() {
        return intentos;
    }

    public void setIntentos(Integer intentos) {
        this.intentos = intentos;
    }

    public String getUltimoError() {
        return ultimoError;
    }

    public void setUltimoError(String ultimoError) {
        this.ultimoError = ultimoError;
    }

    public String getPdfRuta() {
        return pdfRuta;
    }

    public void setPdfRuta(String pdfRuta) {
        this.pdfRuta = pdfRuta;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }
}
