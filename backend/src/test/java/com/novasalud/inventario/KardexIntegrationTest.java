package com.novasalud.inventario;

import com.novasalud.auth.PasswordService;
import com.novasalud.inventario.dto.*;
import com.novasalud.inventario.service.KardexService;
import jakarta.servlet.http.Cookie;
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
class KardexIntegrationTest {
    @Container static final PostgreSQLContainer<?> database=new PostgreSQLContainer<>("postgres:18-bookworm")
        .withDatabaseName("kardex_test").withUsername("test").withPassword("test");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry r) {
        r.add("DATABASE_URL",()->"postgresql://test:test@"+database.getHost()+":"+database.getMappedPort(5432)+"/kardex_test");
        r.add("nova.create-admin",()->false); r.add("nova.alerts.scheduling-enabled",()->false);
    }
    @Autowired JdbcTemplate jdbc;
    @Autowired KardexService service;
    @Autowired MockMvc mvc;
    long user,other,p1,p2,l1,l2,l3,a,b,c,d,e,f;
    long insert(String sql,Object... args) { return jdbc.queryForObject(sql,Long.class,args); }
    @BeforeEach void setup() {
        jdbc.execute("TRUNCATE usuario,categoria CASCADE");
        user=insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'kardex-test','Responsable A','unused' FROM rol WHERE codigo='ADMINISTRADOR' RETURNING id");
        other=insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'seller-test','Responsable B','unused' FROM rol WHERE codigo='VENDEDOR' RETURNING id");
        long cat=insert("INSERT INTO categoria(nombre) VALUES('Prueba') RETURNING id");
        p1=insert("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta) VALUES(?,'TEST-A','Producto A',10) RETURNING id",cat);
        p2=insert("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta) VALUES(?,'TEST-B','Producto B',10) RETURNING id",cat);
        l1=lot(p1,"LOTE-1",5);l2=lot(p1,"LOTE-2",16);l3=lot(p2,"LOTE-3",100);
        a=move(l1,user,"ENTRADA",10,"2026-11-01T04:59:59Z","Inicial A");
        d=move(l2,user,"ENTRADA",20,"2026-11-01T05:00:00Z","Inicial B");
        b=move(l1,other,"SALIDA",-3,"2026-11-01T05:00:00Z","Salida 100% literal");
        e=move(l2,other,"AJUSTE",-4,"2026-11-02T04:59:59Z","Ajuste B");
        c=move(l1,user,"AJUSTE",-2,"2026-11-02T05:00:00Z","Ajuste A");
        f=move(l3,user,"ENTRADA",100,"2026-11-03T05:00:00Z","=SUM(1,2)");
    }
    long lot(long product,String number,int stock) {return insert("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual) VALUES(?,?,CURRENT_DATE+100,?) RETURNING id",product,number,stock);}
    long move(long lot,long actor,String type,int quantity,String date,String reference) {
        return insert("INSERT INTO movimiento(lote_id,usuario_id,tipo,cantidad,fecha,motivo,referencia) VALUES(?,?,?,?,?::timestamptz,'Prueba',?) RETURNING id",lot,actor,type,quantity,date,reference);
    }
    KardexQuery query(Long product,Long lot,LocalDate from,LocalDate to,String type,String origin,Long actor,String reference,int limit,int offset) {
        return new KardexQuery(product,lot,from,to,type,origin,actor,reference,limit,offset);
    }
    KardexQuery all() {return query(null,null,null,null,null,null,null,null,100,0);}
    Cookie session(long id) {
        String token=UUID.randomUUID().toString().replace("-","")+UUID.randomUUID().toString().replace("-","");
        jdbc.update("INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES(?,?,now()+interval '1 hour')",PasswordService.sha256(token),id);
        return new Cookie("nova_session",token);
    }
    @Test void separatesProductsAndLotsAndUsesSignedAdjustmentsAndStableChronology() {
        var result=service.list(all());assertEquals(6,result.total());assertEquals(0,result.noVerificables());
        assertEquals(List.of(a,d,b,e,c,f),result.items().stream().map(KardexRowDto::id).toList());
        var firstLot=result.items().stream().filter(r->r.loteId()==l1).toList();
        assertEquals(List.of(0L,10L,7L),firstLot.stream().map(KardexRowDto::saldoAnterior).toList());
        assertEquals(List.of(10L,7L,5L),firstLot.stream().map(KardexRowDto::saldoPosterior).toList());
        assertEquals(2,firstLot.getLast().salida());assertEquals(0,firstLot.getLast().entrada());
        assertEquals(100L,result.items().getLast().saldoPosterior());
    }
    @Test void limaDateAndPageFiltersNeverResetOpeningBalance() {
        var day=service.list(query(p1,l1,LocalDate.of(2026,11,1),LocalDate.of(2026,11,1),null,null,null,null,1,0));
        assertEquals(1,day.total());assertEquals(b,day.items().getFirst().id());
        assertEquals(10L,day.items().getFirst().saldoAnterior());assertEquals(7L,day.items().getFirst().saldoPosterior());
        var page=service.list(query(p1,l1,null,null,null,null,null,null,1,2));
        assertEquals(3,page.total());assertEquals(c,page.items().getFirst().id());assertEquals(7L,page.items().getFirst().saldoAnterior());
    }
    @Test void unknownLegacyBalanceIsNullAndRecordedBalancesArePreserved() {
        long incomplete=lot(p1,"INCOMPLETO",40);
        long unknown=move(incomplete,user,"ENTRADA",3,"2026-11-04T05:00:00Z","Histórico");
        long recorded=move(incomplete,user,"ENTRADA",3,"2026-11-05T05:00:00Z","Registrado");
        jdbc.update("UPDATE movimiento SET saldo_anterior=7,saldo_posterior=10 WHERE id=?",recorded);
        var result=service.list(query(null,incomplete,null,null,null,null,null,null,100,0));
        assertEquals(1,result.noVerificables());assertEquals(unknown,result.items().getFirst().id());
        assertNull(result.items().getFirst().saldoAnterior());assertNull(result.items().getFirst().saldoPosterior());
        assertEquals(7L,result.items().getLast().saldoAnterior());assertEquals(10L,result.items().getLast().saldoPosterior());
    }
    @Test void combinedFiltersAndCsvUseRealRecordsAndLiteralReferences() {
        var q=query(p1,l1,null,null,"SALIDA","MANUAL",other,"100%",1,0);
        var result=service.list(q);assertEquals(1,result.total());assertEquals(b,result.items().getFirst().id());
        assertEquals(0,service.list(query(p2,l1,null,null,null,null,null,null,100,0)).total());
        var csv=service.export(query(null,null,null,null,null,null,null,null,1,0));
        assertTrue(csv.startsWith("\uFEFF"));assertEquals(7,csv.lines().count());assertTrue(csv.contains("'=SUM(1,2)"));
        assertEquals(3,((List<?>)service.options().get("lotes")).size());
    }
    @Test void validatesHttpFiltersAndAllowsAuthenticatedInventoryReaders() throws Exception {
        mvc.perform(get("/api/inventario/kardex")).andExpect(status().isUnauthorized());
        for (var suffix:List.of("?limit=101","?offset=-1","?tipo=COMPRA","?desde=2026-11-03&hasta=2026-11-01","?productoId=invalid"))
            mvc.perform(get("/api/inventario/kardex"+suffix).cookie(session(user))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/inventario/kardex?limit=1").cookie(session(other))).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(6)).andExpect(jsonPath("$.items[0].saldoAnterior").value(0));
    }
}
