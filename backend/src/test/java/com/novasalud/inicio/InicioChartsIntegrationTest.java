package com.novasalud.inicio;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novasalud.auth.PasswordService;
import com.novasalud.inicio.repository.InicioChartsRepository;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InicioChartsIntegrationTest {
    @Container static final PostgreSQLContainer<?> database = new PostgreSQLContainer<>("postgres:18-bookworm")
        .withDatabaseName("charts_test").withUsername("test").withPassword("test");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("DATABASE_URL", () -> "postgresql://test:test@" + database.getHost() + ":" + database.getMappedPort(5432) + "/charts_test");
        registry.add("nova.create-admin", () -> false);
    }
    @Autowired JdbcTemplate jdbc;
    @Autowired InicioChartsRepository charts;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    long user(String role) {
        return jdbc.queryForObject("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,?,'Charts test','unused' FROM rol WHERE codigo=? RETURNING id",
            Long.class, UUID.randomUUID().toString(), role);
    }
    Cookie session(long user) {
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        jdbc.update("INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES(?,?,now()+interval '1 hour')", PasswordService.sha256(token), user);
        return new Cookie("nova_session", token);
    }
    long product(long category, String name, int minimum) {
        return jdbc.queryForObject("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta,stock_minimo) VALUES(?,?,?,10,?) RETURNING id",
            Long.class, category, UUID.randomUUID().toString(), name, minimum);
    }
    void sale(long user, long product, int quantity, String date) {
        long id = jdbc.queryForObject("INSERT INTO venta(usuario_id,fecha,subtotal,impuesto,total,clave_idempotencia,solicitud_hash) VALUES(?," + date + ",?,0,?,?::uuid,?) RETURNING id",
            Long.class, user, quantity * 10, quantity * 10, UUID.randomUUID().toString(), "a".repeat(64));
        jdbc.update("INSERT INTO detalle_venta(venta_id,producto_id,descripcion,cantidad,precio_unitario,tasa_impuesto,subtotal,impuesto,total) VALUES(?,?,'Test',?,10,0,?,0,?)",
            id, product, quantity, quantity * 10, quantity * 10);
    }
    void lot(long product, int days, int stock, boolean available) {
        jdbc.update("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual,disponible) VALUES(?,?,(now() AT TIME ZONE 'America/Lima')::date+?, ?,?)",
            product, UUID.randomUUID().toString(), days, stock, available);
    }

    @Test void aggregatesRealSalesWithLimaBoundariesAndUserIsolation() {
        long seller = user("VENDEDOR"), other = user("VENDEDOR");
        long category = jdbc.queryForObject("INSERT INTO categoria(nombre) VALUES('Medicamentos') RETURNING id", Long.class);
        long product = product(category, "Paracetamol", 5);
        // UTC 02:30 belongs to the previous Lima day, at 21:30.
        sale(seller, product, 2, "((now() AT TIME ZONE 'America/Lima')::date+time '02:30') AT TIME ZONE 'UTC'");
        sale(seller, product, 1, "((now() AT TIME ZONE 'America/Lima')::date-6+time '00:00') AT TIME ZONE 'America/Lima'");
        sale(seller, product, 8, "((now() AT TIME ZONE 'America/Lima')::date-7+time '23:59') AT TIME ZONE 'America/Lima'");
        sale(other, product, 4, "now()");
        sale(seller, product, 9, "now()");
        jdbc.update("UPDATE venta SET estado='ANULADA',anulada_por=?,anulada_en=now(),motivo_anulacion='Test' WHERE usuario_id=? AND total=90", seller, seller);
        var result = charts.charts(Long.toString(seller), "VENDEDOR", 7);
        assertEquals(7, result.sales().evolution().size());
        assertEquals(24, result.sales().byHour().size());
        assertEquals(new BigDecimal("30.00"), result.sales().evolution().stream().map(r -> new BigDecimal(r.total())).reduce(BigDecimal.ZERO, BigDecimal::add));
        assertEquals(1, result.sales().byHour().get(21).count());
        assertEquals(3, result.sales().topProducts().getFirst().units());
        assertEquals("30.00", result.sales().byCategory().getFirst().total());
        assertEquals(0, result.sales().evolution().getLast().count());
        assertEquals(7, charts.charts("0", "ADMINISTRADOR", 7).sales().topProducts().getFirst().units());
        assertNull(charts.charts("0", "ALMACENERO", 7).sales());
        assertTrue(charts.charts("0", "VENDEDOR", 7).sales().topProducts().isEmpty());
    }

    @Test void inventoryExcludesExpiredUnavailableAndInactiveAndSeparatesBuckets() {
        long category = jdbc.queryForObject("INSERT INTO categoria(nombre) VALUES('Inventario') RETURNING id", Long.class);
        long product = product(category, "Activo", 50);
        for (int days : new int[]{0,30,31,60,61,90}) lot(product, days, 2, true);
        lot(product, -1, 99, true); lot(product, 91, 7, true); lot(product, 10, 99, false);
        long inactive = product(category, "Inactivo", 100);
        lot(inactive, 5, 100, true);
        jdbc.update("UPDATE producto SET activo=false WHERE id=?", inactive);
        var result = charts.charts("0", "ALMACENERO", 30);
        assertEquals(3, result.expirations().size());
        for (var bucket : result.expirations()) { assertEquals(2, bucket.lots()); assertEquals(4, bucket.units()); }
        assertEquals(1, result.criticalStock().size());
        assertEquals(19, result.criticalStock().getFirst().available());
        assertEquals(31, result.criticalStock().getFirst().shortage());
        jdbc.update("DELETE FROM lote WHERE producto_id=?", product);
        jdbc.update("UPDATE producto SET stock_minimo=0 WHERE id=?", product);
        var zero = charts.charts("0", "ALMACENERO", 30);
        assertEquals(0, zero.criticalStock().getFirst().available());
        assertEquals(0, zero.expirations().getFirst().units());
    }

    @Test void endpointRequiresSessionValidatesPeriodAndHidesSalesFromWarehouse() throws Exception {
        mvc.perform(get("/api/inicio/graficos")).andExpect(status().isUnauthorized());
        Cookie seller = session(user("VENDEDOR"));
        for (int days : new int[]{7,30,90}) {
            mvc.perform(get("/api/inicio/graficos").param("days", Integer.toString(days)).cookie(seller))
                .andExpect(status().isOk()).andExpect(jsonPath("$.days").value(days))
                .andExpect(jsonPath("$.sales.evolution.length()").value(days));
        }
        for (String days : new String[]{"0","365","abc"}) mvc.perform(get("/api/inicio/graficos").param("days",days).cookie(seller)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/inicio/graficos").cookie(session(user("ALMACENERO"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.sales").isEmpty()).andExpect(jsonPath("$.expirations.length()").value(3));
    }
}
