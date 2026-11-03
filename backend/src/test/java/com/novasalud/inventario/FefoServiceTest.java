package com.novasalud.inventario;

import com.novasalud.catalogo.model.Producto;
import com.novasalud.inventario.model.Lote;
import com.novasalud.inventario.repository.LoteRepository;
import com.novasalud.inventario.service.FefoService;
import com.novasalud.shared.exception.BusinessException;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class FefoServiceTest {

    private LoteRepository loteRepository;
    private FefoService fefoService;

    @BeforeEach
    void setUp() {
        loteRepository = Mockito.mock(LoteRepository.class);
        fefoService = new FefoService(loteRepository);
    }

    @Test
    @DisplayName("CA-01 · Inventario FEFO: En venta de 40 unidades con lotes 30/50/20, asigna 30 al primero y 10 al segundo")
    void testFefoAssignmentSuccess() {
        Producto producto = new Producto();
        producto.setId(1L);
        producto.setNombre("Paracetamol 500mg");

        LocalDate hoy = LocalDate.now();

        Lote lote1 = new Lote();
        lote1.setId(101L);
        lote1.setNumeroLote("LOTE-001");
        lote1.setStockActual(30);
        lote1.setFechaVencimiento(hoy.plusDays(10));
        lote1.setDisponible(true);

        Lote lote2 = new Lote();
        lote2.setId(102L);
        lote2.setNumeroLote("LOTE-002");
        lote2.setStockActual(50);
        lote2.setFechaVencimiento(hoy.plusDays(20));
        lote2.setDisponible(true);

        Lote lote3 = new Lote();
        lote3.setId(103L);
        lote3.setNumeroLote("LOTE-003");
        lote3.setStockActual(20);
        lote3.setFechaVencimiento(hoy.plusDays(30));
        lote3.setDisponible(true);

        when(loteRepository.findLotesFefoVigentes(eq(1L), any(LocalDate.class)))
            .thenReturn(List.of(lote1, lote2, lote3));

        List<FefoService.AsignacionFefo> asignaciones = fefoService.asignarLotes(1L, "Paracetamol 500mg", 40);

        assertEquals(2, asignaciones.size());
        assertEquals(101L, asignaciones.get(0).lote().getId());
        assertEquals(30, asignaciones.get(0).cantidad());

        assertEquals(102L, asignaciones.get(1).lote().getId());
        assertEquals(10, asignaciones.get(1).cantidad());
    }

    @Test
    @DisplayName("CA-01 / RN-04: Lanza excepción si el stock total de los lotes vigentes es insuficiente")
    void testFefoInsufficientStock() {
        Lote lote1 = new Lote();
        lote1.setId(101L);
        lote1.setStockActual(15);
        lote1.setFechaVencimiento(LocalDate.now().plusDays(5));
        lote1.setDisponible(true);

        when(loteRepository.findLotesFefoVigentes(eq(1L), any(LocalDate.class)))
            .thenReturn(List.of(lote1));

        BusinessException exception = assertThrows(BusinessException.class, () ->
            fefoService.asignarLotes(1L, "Ibuprofeno 400mg", 20)
        );

        assertTrue(exception.getMessage().contains("Stock insuficiente"));
    }
}
