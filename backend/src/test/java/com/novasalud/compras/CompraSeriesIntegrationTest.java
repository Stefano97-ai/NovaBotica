package com.novasalud.compras;

import com.novasalud.auth.PasswordService;
import com.novasalud.compras.dto.*;
import com.novasalud.compras.service.CompraService;
import com.novasalud.shared.exception.BusinessException;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers @SpringBootTest @AutoConfigureMockMvc
class CompraSeriesIntegrationTest {
    @Container static final PostgreSQLContainer<?> database = new PostgreSQLContainer<>("postgres:18-bookworm")
        .withDatabaseName("compras_series_test").withUsername("test").withPassword("test");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("DATABASE_URL", () -> "postgresql://test:test@" + database.getHost() + ":" + database.getMappedPort(5432) + "/compras_series_test");
        registry.add("nova.create-admin", () -> false);
        registry.add("nova.alerts.scheduling-enabled", () -> false);
    }
    @Autowired JdbcTemplate jdbc;
    @Autowired CompraService service;
    @Autowired MockMvc mvc;
    long user, seller, category, supplier, product, regular;
    long insert(String sql, Object... args) { return jdbc.queryForObject(sql, Long.class, args); }
    @BeforeEach void setup() {
        jdbc.execute("TRUNCATE usuario,categoria,proveedor CASCADE");
        user = insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'compras-test','Test','unused' FROM rol WHERE codigo='ADMINISTRADOR' RETURNING id");
        seller = insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'seller-test','Seller','unused' FROM rol WHERE codigo='VENDEDOR' RETURNING id");
        category = insert("INSERT INTO categoria(nombre) VALUES('Dispositivos') RETURNING id");
        supplier = insert("INSERT INTO proveedor(ruc,razon_social) VALUES('00000000001','Proveedor de prueba') RETURNING id");
        product = insert("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta,requiere_serie) VALUES(?,'SERIE','Termómetro',10,true) RETURNING id", category);
        regular = insert("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta) VALUES(?,'NORMAL','Alcohol',5) RETURNING id", category);
    }
    RegistroCompraDto.Linea line(long id, int qty, List<String> serials) {
        return new RegistroCompraDto.Linea(id, qty, new BigDecimal("5.00"), "LOTE-01", LocalDate.now().plusYears(1), serials);
    }
    RegistroCompraDto purchase(RegistroCompraDto.Linea... lines) { return new RegistroCompraDto(supplier, List.of(lines)); }
    int count(String table) { return jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class); }
    Cookie session(long id) {
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        jdbc.update("INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES(?,?,now()+interval '1 hour')", PasswordService.sha256(token), id);
        return new Cookie("nova_session", token);
    }

    @Test void registrationReceivesStockAndLinksEverySerialToPurchaseAndLot() {
        var result = service.registrar(purchase(line(product, 2, List.of(" A-001 ", "A-002")), line(regular, 3, List.of())), user);
        assertEquals("RECIBIDA", result.estado());
        assertEquals(0, result.detalles().getFirst().cantidadPendiente());
        assertEquals(2, count("recepcion_lote")); assertEquals(2, count("movimiento")); assertEquals(2, count("unidad_serializada"));
        assertEquals(5, jdbc.queryForObject("SELECT sum(stock_actual) FROM lote", Integer.class));
        assertEquals(2, jdbc.queryForObject("SELECT count(*) FROM unidad_serializada u JOIN detalle_compra d ON d.id=u.detalle_compra_id JOIN lote l ON l.id=u.lote_id WHERE d.compra_id=? AND d.producto_id=u.producto_id AND l.producto_id=u.producto_id AND u.estado='DISPONIBLE'", Integer.class, result.id()));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM unidad_serializada WHERE numero_serie='A-001'", Integer.class));
    }
    @Test void invalidCountsAndDuplicatesDoNotCreatePurchaseOrStock() {
        for (var serials : List.of(List.<String>of(), List.of("ONE"), List.of("ONE", "ONE"), List.of("ONE", "TWO", "THREE"))) {
            assertThrows(BusinessException.class, () -> service.registrar(purchase(line(product, 2, serials)), user));
            assertEquals(0, count("compra")); assertEquals(0, count("lote"));
        }
        assertThrows(BusinessException.class, () -> service.registrar(purchase(line(regular, 1, List.of("WRONG"))), user));
    }
    @Test void previouslyRegisteredSerialRollsBackWholePurchaseIncludingStockAndReceipts() {
        service.registrar(purchase(line(product, 1, List.of("EXISTING"))), user);
        assertThrows(BusinessException.class, () -> service.registrar(purchase(line(regular, 3, List.of()), line(product, 1, List.of("EXISTING"))), user));
        assertEquals(1, count("compra")); assertEquals(1, count("recepcion_lote")); assertEquals(1, count("movimiento"));
        assertEquals(1, count("unidad_serializada")); assertEquals(1, jdbc.queryForObject("SELECT sum(stock_actual) FROM lote", Integer.class));
    }
    @Test void httpValidationPermissionsAndRealProductFlag() throws Exception {
        mvc.perform(post("/api/productos").cookie(session(user)).header("X-Nova-Client", "web").contentType("application/json")
            .content("""
                {"categoriaId":%d,"codigo":"NEW-SERIAL","nombre":"Oxímetro","precioVenta":25,"stockMinimo":0,"requiereSerie":true}
                """.formatted(category))).andExpect(status().isCreated()).andExpect(jsonPath("$.requiereSerie").value(true));
        String body = """
            {"proveedorId":%d,"items":[{"productoId":%d,"cantidad":1,"costoUnitario":5,"numeroLote":"TEST","fechaVencimiento":"%s","series":["TEST-1"]}]}
            """.formatted(supplier, product, LocalDate.now().plusYears(1));
        mvc.perform(post("/api/compras/registro").cookie(session(seller)).header("X-Nova-Client", "web").contentType("application/json").content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/compras/registro").cookie(session(user)).header("X-Nova-Client", "web").contentType("application/json").content(body.replace("TEST-1", " "))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/compras/registro").cookie(session(user)).header("X-Nova-Client", "web").contentType("application/json").content(body)).andExpect(status().isCreated()).andExpect(jsonPath("$.estado").value("RECIBIDA"));
    }
}
