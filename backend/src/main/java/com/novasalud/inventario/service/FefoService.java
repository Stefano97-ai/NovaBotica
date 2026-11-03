package com.novasalud.inventario.service;

import com.novasalud.inventario.model.Lote;
import com.novasalud.inventario.repository.LoteRepository;
import com.novasalud.shared.exception.BusinessException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FefoService {

    public record AsignacionFefo(Lote lote, int cantidad) {}

    private final LoteRepository loteRepository;

    public FefoService(LoteRepository loteRepository) {
        this.loteRepository = loteRepository;
    }

    /**
     * Aplica el algoritmo FEFO (First Expired, First Out - RN-03 / CA-01):
     * Asigna primero los lotes vigentes con fecha de vencimiento más próxima.
     * Excluye lotes vencidos y no disponibles.
     */
    public List<AsignacionFefo> asignarLotes(Long productoId, String productoNombre, int cantidadRequerida) {
        if (cantidadRequerida <= 0) {
            throw new BusinessException("La cantidad solicitada debe ser mayor a 0.");
        }

        List<Lote> lotesVigentes = loteRepository.findLotesFefoVigentes(productoId, LocalDate.now());
        List<AsignacionFefo> asignaciones = new ArrayList<>();
        int pendiente = cantidadRequerida;

        for (Lote lote : lotesVigentes) {
            if (pendiente <= 0) {
                break;
            }
            int disponibleEnLote = lote.getStockActual();
            if (disponibleEnLote <= 0) {
                continue;
            }

            int aTomar = Math.min(disponibleEnLote, pendiente);
            asignaciones.add(new AsignacionFefo(lote, aTomar));
            pendiente -= aTomar;
        }

        if (pendiente > 0) {
            throw new BusinessException(
                "Stock insuficiente para '" + (productoNombre != null ? productoNombre : "Producto ID " + productoId) +
                "'. Faltan " + pendiente + " unidades vigentes."
            );
        }

        return asignaciones;
    }
}
