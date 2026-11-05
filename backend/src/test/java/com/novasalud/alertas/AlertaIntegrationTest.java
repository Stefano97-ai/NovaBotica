package com.novasalud.alertas;

import com.novasalud.alertas.dto.*;
import com.novasalud.alertas.service.AlertaService;
import com.novasalud.auth.PasswordService;
import com.novasalud.auth.SessionUser;
import com.novasalud.inventario.dto.AjusteStockDto;
import com.novasalud.inventario.service.InventarioService;
import jakarta.servlet.http.Cookie;
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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers @SpringBootTest @AutoConfigureMockMvc
class AlertaIntegrationTest {
    @Container static final PostgreSQLContainer<?> database=new PostgreSQLContainer<>("postgres:18-bookworm")
        .withDatabaseName("alertas_test").withUsername("test").withPassword("test");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("DATABASE_URL",()->"postgresql://test:test@"+database.getHost()+":"+database.getMappedPort(5432)+"/alertas_test");
        registry.add("nova.create-admin",()->false);
        registry.add("nova.alerts.scheduling-enabled",()->false);
    }
    @Autowired JdbcTemplate jdbc;
    @Autowired AlertaService service;
    @Autowired InventarioService inventory;
    @Autowired PlatformTransactionManager transactions;
    @Autowired MockMvc mvc;
    SessionUser admin,otherAdmin,seller,warehouse;
    long category;
    long insert(String sql,Object... args) {return jdbc.queryForObject(sql,Long.class,args);}
    SessionUser user(String role) {
        String name=UUID.randomUUID().toString();
        long id=insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,?,'Alert test','unused' FROM rol WHERE codigo=? RETURNING id",name,role);
        return new SessionUser(Long.toString(id),name,"Alert test",role);
    }
    @BeforeEach void setup() {
        jdbc.execute("TRUNCATE usuario,categoria CASCADE");
        admin=user("ADMINISTRADOR"); otherAdmin=user("ADMINISTRADOR");seller=user("VENDEDOR");warehouse=user("ALMACENERO");
        category=insert("INSERT INTO categoria(nombre) VALUES('Prueba') RETURNING id");
    }
    long product(int minimum) {
        return insert("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta,stock_minimo) VALUES(?,?,'Producto de prueba',10,?) RETURNING id",category,UUID.randomUUID().toString(),minimum);
    }
    long lot(long product,int days,int stock) {
        return insert("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual) VALUES(?,?,(now() AT TIME ZONE 'America/Lima')::date+?,?) RETURNING id",product,UUID.randomUUID().toString(),days,stock);
    }
    AlertasPageDto page(SessionUser user,String state) {return service.list(user,state,"TODAS","TODAS",false,100,0);}
    Cookie session(SessionUser user) {
        String token=UUID.randomUUID().toString().replace("-","")+UUID.randomUUID().toString().replace("-","");
        jdbc.update("INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES(?,?,now()+interval '1 hour')",PasswordService.sha256(token),Long.parseLong(user.id()));
        return new Cookie("nova_session",token);
    }

    @Test void stockLifecycleDoesNotDuplicateAndOnlyEscalationRenotifies() {
        long p=product(5),l=lot(p,300,3);
        service.reconcile(); service.reconcile();
        var first=page(admin,"ACTIVA").items().getFirst();
        assertEquals("STOCK_BAJO",first.tipo());assertEquals(1,page(admin,"ACTIVA").total());
        service.read(admin,Long.parseLong(first.id()),first.version());
        assertEquals(0,page(admin,"ACTIVA").unreadCount());assertEquals(1,page(otherAdmin,"ACTIVA").unreadCount());
        jdbc.update("UPDATE lote SET stock_actual=2 WHERE id=?",l);service.reconcile();
        assertEquals(first.version(),page(admin,"ACTIVA").items().getFirst().version());
        assertEquals(0,page(admin,"ACTIVA").unreadCount());
        jdbc.update("UPDATE lote SET stock_actual=0 WHERE id=?",l);service.reconcile();
        var escalated=page(admin,"ACTIVA").items().getFirst();
        assertEquals(first.id(),escalated.id());assertEquals("AGOTADO",escalated.tipo());assertEquals(2,escalated.version());
        service.read(admin,Long.parseLong(first.id()),1);assertEquals(1,page(admin,"ACTIVA").unreadCount());
        service.readAll(admin);assertEquals(0,page(admin,"ACTIVA").unreadCount());
        jdbc.update("UPDATE lote SET stock_actual=10 WHERE id=?",l);service.reconcile();
        assertEquals(0,page(admin,"ACTIVA").total());assertNotNull(page(admin,"RESUELTA").items().getFirst().resueltaEn());
        jdbc.update("UPDATE lote SET stock_actual=0 WHERE id=?",l);service.reconcile();
        assertEquals(1,page(admin,"ACTIVA").unreadCount());assertEquals(2,page(admin,"TODAS").total());
        assertNotEquals(first.id(),page(admin,"ACTIVA").items().getFirst().id());
    }

    @Test void expirationBoundariesExcludeInactiveUnavailableAndEmptyLots() {
        long p=product(0);
        for(int days:new int[]{-1,0,7,8,30,31}) lot(p,days,2);
        long unavailable=lot(p,5,99);jdbc.update("UPDATE lote SET disponible=false WHERE id=?",unavailable);
        lot(p,-5,0);
        long inactive=product(100);lot(inactive,-2,100);jdbc.update("UPDATE producto SET activo=false WHERE id=?",inactive);
        service.reconcile();var alerts=page(admin,"ACTIVA");
        assertEquals(5,alerts.total());
        assertEquals(1,alerts.items().stream().filter(a->a.tipo().equals("VENCIDO")).count());
        assertEquals(2,alerts.items().stream().filter(a->a.tipo().equals("VENCIMIENTO_URGENTE")).count());
        assertEquals(2,alerts.items().stream().filter(a->a.tipo().equals("POR_VENCER")).count());
        assertEquals(3,page(seller,"ACTIVA").total());
        var urgent=alerts.items().stream().filter(a->a.tipo().equals("VENCIMIENTO_URGENTE")).findFirst().orElseThrow();
        service.read(admin,Long.parseLong(urgent.id()),urgent.version());
        jdbc.update("UPDATE lote SET fecha_vencimiento=(now() AT TIME ZONE 'America/Lima')::date-1 WHERE id=?",Long.parseLong(urgent.loteId()));
        service.reconcile();
        var expired=page(admin,"ACTIVA").items().stream().filter(a->a.id().equals(urgent.id())).findFirst().orElseThrow();
        assertEquals("VENCIDO",expired.tipo());assertEquals(2,expired.version());assertFalse(expired.leida());
    }

    @Test void roleVisibilityAndReadingAreIndividualAndVersionBounded() throws Exception {
        long low=product(5);lot(low,300,2);product(5);long exp=product(0);lot(exp,20,1);lot(exp,3,1);
        service.reconcile();
        assertEquals(4,page(admin,"ACTIVA").total());assertEquals(4,page(warehouse,"ACTIVA").total());assertEquals(2,page(seller,"ACTIVA").total());
        var hidden=page(admin,"ACTIVA").items().stream().filter(a->a.tipo().equals("STOCK_BAJO")).findFirst().orElseThrow();
        mvc.perform(get("/api/alertas")).andExpect(status().isUnauthorized());
        Cookie cookie=session(seller);
        mvc.perform(get("/api/alertas").cookie(cookie)).andExpect(status().isOk()).andExpect(jsonPath("$.unreadCount").value(2));
        mvc.perform(put("/api/alertas/"+hidden.id()+"/lectura").cookie(cookie).contentType("application/json").content("{\"version\":1}"))
            .andExpect(status().isNotFound());
        var visible=page(seller,"ACTIVA").items().getFirst();
        mvc.perform(put("/api/alertas/"+visible.id()+"/lectura").cookie(cookie).contentType("application/json").content("{\"version\":999}"))
            .andExpect(status().isNotFound());
        mvc.perform(put("/api/alertas/"+visible.id()+"/lectura").cookie(cookie).contentType("application/json")
            .content("{\"version\":1,\"usuarioId\":"+admin.id()+"}"))
            .andExpect(status().isNoContent());
        assertEquals(1,page(seller,"ACTIVA").unreadCount());assertEquals(4,page(admin,"ACTIVA").unreadCount());
        service.readAll(seller);assertEquals(0,page(seller,"ACTIVA").unreadCount());assertEquals(4,page(admin,"ACTIVA").unreadCount());
    }

    @Test void filtersPaginationAndInvalidInputsAreHandled() throws Exception {
        product(5);product(8);long p=product(0);lot(p,15,1);service.reconcile();
        var filtered=service.list(admin,"ACTIVA","AGOTADO","CRITICA",true,1,0);
        assertEquals(2,filtered.total());assertEquals(1,filtered.items().size());assertEquals(3,filtered.unreadCount());
        assertNotEquals(filtered.items().getFirst().id(),service.list(admin,"ACTIVA","AGOTADO","CRITICA",true,1,1).items().getFirst().id());
        Cookie cookie=session(admin);
        for(String query:new String[]{"limit=abc","limit=0","limit=101","offset=-1","estado=DESCONOCIDA","tipo=OTRA","prioridad=BAJA","noLeidas=abc"})
            mvc.perform(get("/api/alertas?"+query).cookie(cookie)).andExpect(status().isBadRequest());
    }

    @Test void reconciliationAcrossConcurrentRequestsCreatesOneEpisode() throws Exception {
        product(10);var pool=Executors.newFixedThreadPool(3);var start=new CountDownLatch(1);
        try {
            List<Future<?>> results=new ArrayList<>();
            for(int i=0;i<3;i++)results.add(pool.submit(()->{try{start.await();}catch(InterruptedException e){throw new RuntimeException(e);}service.reconcile();}));
            start.countDown();for(var result:results)result.get(15,TimeUnit.SECONDS);
            assertEquals(1,page(admin,"TODAS").total());assertEquals(3,jdbc.queryForObject("SELECT count(*) FROM alerta_rol",Integer.class));
        }finally{pool.shutdownNow();}
    }

    @Test void committedAdjustmentsResolveAlertsButRollbackDoesNotChangeThem() {
        long p=product(5),l=lot(p,300,3);service.reconcile();
        var tx=new TransactionTemplate(transactions);
        assertThrows(IllegalStateException.class,()->tx.executeWithoutResult(status->{
            inventory.registrarAjuste(new AjusteStockDto(l,10,"Reposición de prueba","Test"),Long.parseLong(admin.id()));
            throw new IllegalStateException("rollback");
        }));
        assertEquals(1,page(admin,"ACTIVA").total());assertEquals(3,jdbc.queryForObject("SELECT stock_actual FROM lote WHERE id=?",Integer.class,l));
        inventory.registrarAjuste(new AjusteStockDto(l,10,"Reposición de prueba","Test"),Long.parseLong(admin.id()));
        assertEquals(0,page(admin,"ACTIVA").total());assertEquals(1,page(admin,"RESUELTA").total());
    }
}
