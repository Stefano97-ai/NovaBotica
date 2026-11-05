package com.novasalud.ventas;

import com.novasalud.auth.PasswordService;
import com.novasalud.catalogo.repository.ProductoRepository;
import com.novasalud.inventario.dto.CrearSerieDto;
import com.novasalud.inventario.service.SerieUnidadService;
import com.novasalud.ventas.dto.*;
import com.novasalud.ventas.service.VentaService;
import com.novasalud.shared.exception.BusinessException;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
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
class VentaSeriesIntegrationTest {
    @Container static final PostgreSQLContainer<?> database=new PostgreSQLContainer<>("postgres:18-bookworm")
        .withDatabaseName("ventas_series_test").withUsername("test").withPassword("test");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("DATABASE_URL",()->"postgresql://test:test@"+database.getHost()+":"+database.getMappedPort(5432)+"/ventas_series_test");
        registry.add("nova.create-admin",()->false);
    }
    @Autowired JdbcTemplate jdbc;
    @Autowired SerieUnidadService series;
    @Autowired VentaService ventas;
    @Autowired ProductoRepository products;
    @Autowired MockMvc mvc;
    long user,admin,product,lot1,lot2,purchaseDetail,a1,a2,b1,ruc,dni;
    long insert(String sql,Object... args) {return jdbc.queryForObject(sql,Long.class,args);}
    @BeforeEach void setup() {
        jdbc.execute("TRUNCATE usuario,categoria,proveedor,cliente CASCADE");
        user=insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'vendedor-test','Test','unused' FROM rol WHERE codigo='VENDEDOR' RETURNING id");
        admin=insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'admin-test','Test','unused' FROM rol WHERE codigo='ADMINISTRADOR' RETURNING id");
        long category=insert("INSERT INTO categoria(nombre) VALUES('Dispositivos') RETURNING id");
        product=insert("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta) VALUES(?,'TEST-SERIE','Termómetro',10) RETURNING id",category);
        long supplier=insert("INSERT INTO proveedor(ruc,razon_social) VALUES('00000000001','Proveedor de prueba') RETURNING id");
        long purchase=insert("INSERT INTO compra(proveedor_id,usuario_id,total,estado) VALUES(?,?,50,'RECIBIDA') RETURNING id",supplier,user);
        purchaseDetail=insert("INSERT INTO detalle_compra(compra_id,producto_id,cantidad,costo_unitario) VALUES(?,?,10,5) RETURNING id",purchase,product);
        lot1=insert("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual) VALUES(?,'PRIMERO',CURRENT_DATE+20,4) RETURNING id",product);
        lot2=insert("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual) VALUES(?,'SEGUNDO',CURRENT_DATE+60,6) RETURNING id",product);
        for (long lot:new long[]{lot1,lot2}) {
            int qty=lot==lot1?4:6;
            long receipt=insert("INSERT INTO recepcion_lote(detalle_compra_id,producto_id,lote_id,usuario_id,cantidad_recibida,clave_idempotencia) VALUES(?,?,?,?,?,?::uuid) RETURNING id",purchaseDetail,product,lot,user,qty,UUID.randomUUID().toString());
            jdbc.update("INSERT INTO movimiento(lote_id,usuario_id,tipo,cantidad,motivo,referencia,recepcion_lote_id,saldo_anterior,saldo_posterior) VALUES(?,?,'ENTRADA',?,'Test','Test',?,0,?)",lot,user,qty,receipt,qty);
        }
        a1=series.registrar(product,new CrearSerieDto(lot1,purchaseDetail,"SERIE-A1",null));
        a2=series.registrar(product,new CrearSerieDto(lot1,purchaseDetail,"SERIE-A2",null));
        b1=series.registrar(product,new CrearSerieDto(lot2,purchaseDetail,"SERIE-B1",null));
        ruc=insert("INSERT INTO cliente(tipo_documento,numero_documento,nombre) VALUES('RUC','00000000010','Empresa de prueba') RETURNING id");
        dni=insert("INSERT INTO cliente(tipo_documento,numero_documento,nombre) VALUES('DNI','00000010','Cliente de prueba') RETURNING id");
    }
    CreateVentaDto sale(String type,Long customer,int quantity,List<Long> selected) {
        return new CreateVentaDto(customer,type,List.of(new ItemVentaDto(product,quantity,null,selected)),
            quantity==2?List.of(new PagoDto("EFECTIVO",new BigDecimal("6.00"),"CAJA"),new PagoDto("YAPE",new BigDecimal("14.00"),"OP-123")):
            List.of(new PagoDto("EFECTIVO",BigDecimal.valueOf(quantity*10),null)),UUID.randomUUID().toString());
    }
    int stock(long lot) { return jdbc.queryForObject("SELECT stock_actual FROM lote WHERE id=?",Integer.class,lot); }
    Cookie session(long id) {
        String token=UUID.randomUUID().toString().replace("-","")+UUID.randomUUID().toString().replace("-","");
        jdbc.update("INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES(?,?,now()+interval '1 hour')",PasswordService.sha256(token),id);
        return new Cookie("nova_session",token);
    }

    @Test void splitPaymentsAndPartialOptionalSerialsCommitAtomicallyAndRetryOnlyOnce() {
        assertTrue(products.findById(product).orElseThrow().isRequiereSerie());
        var request=sale("BOLETA",dni,2,List.of(a1));
        var result=ventas.registrarVenta(request,user);
        assertEquals(2,result.pagos().size());
        assertEquals("OP-123",result.pagos().get(1).referencia());
        assertEquals(1,result.detalles().getFirst().series().size());
        assertEquals(2,stock(lot1)); assertEquals(6,stock(lot2));
        assertEquals("VENDIDA",jdbc.queryForObject("SELECT estado FROM unidad_serializada WHERE id=?",String.class,a1));
        assertEquals("DISPONIBLE",jdbc.queryForObject("SELECT estado FROM unidad_serializada WHERE id=?",String.class,a2));
        assertEquals(result.id(),ventas.registrarVenta(request,user).id()); assertEquals(2,stock(lot1));
        assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM venta",Integer.class));
    }
    @Test void flaggedProductCanBeSoldWithoutAnySerials() {
        var result=ventas.registrarVenta(sale("BOLETA",null,1,null),user);
        assertTrue(result.detalles().getFirst().series().isEmpty()); assertEquals(3,stock(lot1));
    }
    @Test void invalidOrRepeatedOrNonFefoSerialsRollbackEverything() {
        for (List<Long> selected:List.of(List.of(b1),List.of(a1,a1),List.of(Long.MAX_VALUE))) {
            assertThrows(BusinessException.class,()->ventas.registrarVenta(sale("BOLETA",null,2,selected),user));
            assertEquals(4,stock(lot1)); assertEquals(6,stock(lot2));
            assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM venta",Integer.class));
            assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM pago",Integer.class));
            assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM unidad_serializada WHERE estado='VENDIDA'",Integer.class));
        }
    }
    @Test void invoiceRequiresRucAndReceiptRejectsRucAndListingRespectsFefo() {
        assertThrows(BusinessException.class,()->ventas.registrarVenta(sale("FACTURA",null,1,null),user));
        assertThrows(BusinessException.class,()->ventas.registrarVenta(sale("FACTURA",dni,1,null),user));
        assertThrows(BusinessException.class,()->ventas.registrarVenta(sale("BOLETA",ruc,1,null),user));
        assertNotNull(ventas.registrarVenta(sale("FACTURA",ruc,1,null),user).id());
        var options=series.disponibles(product,2);
        assertEquals(2,options.stream().filter(s->s.id()==a1).findFirst().orElseThrow().limiteLote());
        assertEquals(0,options.stream().filter(s->s.id()==b1).findFirst().orElseThrow().limiteLote());
    }
    @Test void cancellingReturnsStockAndReleasesSelectedUnits() {
        var result=ventas.registrarVenta(sale("BOLETA",null,1,List.of(a1)),user);
        ventas.anularVenta(result.id(),new AnularVentaDto("Anulación de prueba"),admin);
        assertEquals(4,stock(lot1));
        assertEquals("DISPONIBLE",jdbc.queryForObject("SELECT estado FROM unidad_serializada WHERE id=?",String.class,a1));
        assertNull(jdbc.queryForObject("SELECT asignacion_id FROM unidad_serializada WHERE id=?",Long.class,a1));
    }
    @Test void concurrentSalesCannotUseTheSameUniqueUnit() throws Exception {
        var pool=Executors.newFixedThreadPool(2); var start=new CountDownLatch(1);
        try {
            Callable<Boolean> task=()->{start.await();try {ventas.registrarVenta(sale("BOLETA",null,1,List.of(a1)),user);return true;}catch(BusinessException e){return false;}};
            var one=pool.submit(task);var two=pool.submit(task);start.countDown();
            assertNotEquals(one.get(15,TimeUnit.SECONDS),two.get(15,TimeUnit.SECONDS));
            assertEquals(3,stock(lot1)); assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM venta",Integer.class));
        } finally { pool.shutdownNow(); }
    }
    @Test void apiEnforcesSerialPermissionsAndAcceptsCeCustomersAndValidatesPayments() throws Exception {
        mvc.perform(get("/api/productos/"+product+"/series")).andExpect(status().isUnauthorized());
        Cookie seller=session(user);
        mvc.perform(get("/api/productos/"+product+"/series").cookie(seller)).andExpect(status().isOk());
        mvc.perform(post("/api/productos/"+product+"/series").cookie(seller).contentType("application/json")
            .content("{\"loteId\":"+lot1+",\"detalleCompraId\":"+purchaseDetail+",\"numeroSerie\":\"NUEVA\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/clientes").cookie(seller).contentType("application/json")
            .content("{\"tipoDocumento\":\"CE\",\"numeroDocumento\":\"CE123456\",\"nombre\":\"Cliente CE de prueba\"}"))
            .andExpect(status().isCreated());
        var invalid=sale("BOLETA",null,1,List.of());
        var insufficient=new CreateVentaDto(null,"BOLETA",invalid.items(),List.of(new PagoDto("EFECTIVO",new BigDecimal("2.00"),null)),UUID.randomUUID().toString());
        assertThrows(BusinessException.class,()->ventas.registrarVenta(insufficient,user)); assertEquals(4,stock(lot1));
    }
}
