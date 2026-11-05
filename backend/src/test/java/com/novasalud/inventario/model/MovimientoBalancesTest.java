package com.novasalud.inventario.model;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class MovimientoBalancesTest {
    @Test void capturesEntrySaleAndCompensationBeforeFlush() {
        for (int[] sample : new int[][]{{8, 8, 0}, {5, -3, 8}, {8, 3, 5}}) {
            Lote lot = new Lote();
            lot.setStockActual(sample[0]);
            Movimiento movement = new Movimiento();
            movement.setLote(lot);
            movement.setCantidad(sample[1]);
            movement.capturarSaldos();
            assertEquals(sample[2], movement.getSaldoAnterior());
            assertEquals(sample[0], movement.getSaldoPosterior());
        }
    }
}
