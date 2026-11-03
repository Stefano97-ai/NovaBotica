package com.novasalud.comprobantes.model;

import jakarta.persistence.*;

@Entity
@Table(name = "serie_comprobante", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tipo_comprobante_id", "serie"})
})
public class SerieComprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "tipo_comprobante_id", nullable = false)
    private TipoComprobante tipoComprobante;

    @Column(nullable = false, length = 20)
    private String serie;

    @Column(name = "ultimo_correlativo", nullable = false)
    private Long ultimoCorrelativo = 0L;

    @Column(nullable = false)
    private boolean activo = true;

    public SerieComprobante() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TipoComprobante getTipoComprobante() {
        return tipoComprobante;
    }

    public void setTipoComprobante(TipoComprobante tipoComprobante) {
        this.tipoComprobante = tipoComprobante;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public Long getUltimoCorrelativo() {
        return ultimoCorrelativo;
    }

    public void setUltimoCorrelativo(Long ultimoCorrelativo) {
        this.ultimoCorrelativo = ultimoCorrelativo;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
