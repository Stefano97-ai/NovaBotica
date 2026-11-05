package com.novasalud.integration;

import com.novasalud.auth.PasswordService;
import com.novasalud.reportes.service.ReporteDetalleService;
import com.novasalud.shared.exception.BadRequestException;
import jakarta.servlet.http.Cookie;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers @SpringBootTest @AutoConfigureMockMvc
class ReportesProductosIntegrationTest {
    @Container static final PostgreSQLContainer<?> database=new PostgreSQLContainer<>("postgres:18-bookworm").withDatabaseName("reports_products_test").withUsername("test").withPassword("test");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry r){r.add("DATABASE_URL",()->"postgresql://test:test@"+database.getHost()+":"+database.getMappedPort(5432)+"/reports_products_test");r.add("nova.create-admin",()->false);r.add("nova.alerts.scheduling-enabled",()->false);}
    @Autowired JdbcTemplate jdbc;@Autowired MockMvc mvc;@Autowired ReporteDetalleService reports;
    long admin,seller,category,product;
    long insert(String sql,Object...args){return jdbc.queryForObject(sql,Long.class,args);}
    @BeforeEach void setup(){jdbc.execute("TRUNCATE usuario,categoria,proveedor CASCADE");admin=insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'admin-test','Admin','unused' FROM rol WHERE codigo='ADMINISTRADOR' RETURNING id");seller=insert("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'seller-test','Seller','unused' FROM rol WHERE codigo='VENDEDOR' RETURNING id");category=insert("INSERT INTO categoria(nombre) VALUES('Dispositivos') RETURNING id");product=insert("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta,stock_minimo) VALUES(?,'TEST-IMG','Original',10,0) RETURNING id",category);}
    Cookie session(long user){String token=UUID.randomUUID().toString().replace("-","")+UUID.randomUUID().toString().replace("-","");jdbc.update("INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES(?,?,now()+interval '1 hour')",PasswordService.sha256(token),user);return new Cookie("nova_session",token);}
    MockMultipartFile metadata(String name){return new MockMultipartFile("datos","datos.json","application/json",("{\"categoriaId\":"+category+",\"nombre\":\""+name+"\",\"unidadBase\":\"UNIDAD\",\"precioVenta\":12.50,\"stockMinimo\":0,\"activo\":true,\"requiereSerie\":true}").getBytes(java.nio.charset.StandardCharsets.UTF_8));}
    byte[] png()throws Exception{var output=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(20,10,BufferedImage.TYPE_INT_RGB),"png",output);return output.toByteArray();}
    @Test void imageAndMetadataSaveTogetherAndCanBeReadAfterReload()throws Exception{
        mvc.perform(multipart("/api/productos/"+product+"/edicion").file(metadata("Actualizado")).file(new MockMultipartFile("imagen","producto.png","image/png",png())).cookie(session(admin)).header("X-Nova-Client","web"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.imagenUrl").isNotEmpty()).andExpect(jsonPath("$.requiereSerie").value(true));
        mvc.perform(get("/api/productos/"+product).cookie(session(admin))).andExpect(jsonPath("$.nombre").value("Actualizado")).andExpect(jsonPath("$.stockMinimo").value(0));
        mvc.perform(get("/api/productos/"+product+"/imagen").cookie(session(seller))).andExpect(status().isOk()).andExpect(content().contentType("image/png"));
        assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM producto_imagen",Integer.class));
    }
    @Test void invalidOrOversizedImageRollsBackMetadataAndSellerCannotEdit()throws Exception{
        for(byte[] data:List.of("<svg>invalid</svg>".getBytes(),new byte[2*1024*1024+1])){
            mvc.perform(multipart("/api/productos/"+product+"/edicion").file(metadata("No debe guardar")).file(new MockMultipartFile("imagen","fake.png","image/png",data)).cookie(session(admin)).header("X-Nova-Client","web")).andExpect(status().isBadRequest());
            assertEquals("Original",jdbc.queryForObject("SELECT nombre FROM producto WHERE id=?",String.class,product));
        }
        mvc.perform(multipart("/api/productos/"+product+"/edicion").file(metadata("No permitido")).cookie(session(seller)).header("X-Nova-Client","web")).andExpect(status().isForbidden());
        mvc.perform(patch("/api/productos/"+product+"/activo").cookie(session(admin)).header("X-Nova-Client","web").contentType("application/json").content("{\"activo\":false}")).andExpect(status().isOk()).andExpect(jsonPath("$.activo").value(false));
        assertFalse(jdbc.queryForObject("SELECT activo FROM producto WHERE id=?",Boolean.class,product));
    }
    @Test void periodsUseLimaBoundariesAndRealDataAcrossReportTabs(){
        insert("INSERT INTO venta(usuario_id,fecha,subtotal,impuesto,total,estado,clave_idempotencia,solicitud_hash) VALUES(?,'2026-11-05T04:59:59Z',10,0,10,'CONFIRMADA',?::uuid,?) RETURNING id",admin,UUID.randomUUID().toString(),"a".repeat(64));
        long sale=insert("INSERT INTO venta(usuario_id,fecha,subtotal,impuesto,total,estado,clave_idempotencia,solicitud_hash) VALUES(?,'2026-11-05T05:00:00Z',20,0,20,'CONFIRMADA',?::uuid,?) RETURNING id",admin,UUID.randomUUID().toString(),"b".repeat(64));
        insert("INSERT INTO detalle_venta(venta_id,producto_id,descripcion,cantidad,precio_unitario,tasa_impuesto,subtotal,impuesto,total) VALUES(?,?,'Test',2,10,0,20,0,20) RETURNING id",sale,product);
        var day=LocalDate.of(2026,11,5);var rows=(List<?>)reports.detalle("ventas",day,day).get("rows");assertEquals(1,rows.size());
        var stockRows=(List<?>)reports.detalle("inventario",day,day).get("rows");assertEquals(1,stockRows.size());assertEquals("A",((Map<?,?>)stockRows.getFirst()).get("tipo"));
        assertTrue(((List<?>)reports.detalle("compras",day,day).get("rows")).isEmpty());
        assertTrue(((List<?>)reports.detalle("vencimientos",day,day).get("rows")).isEmpty());
        assertThrows(BadRequestException.class,()->reports.detalle("ventas",day.plusDays(1),day));
        assertThrows(BadRequestException.class,()->reports.detalle("invalid",day,day));
    }
    @Test void reportAndExportEndpointsRespectRoles()throws Exception{
        mvc.perform(get("/api/reportes/detalle?tipo=ventas").cookie(session(seller))).andExpect(status().isForbidden());
        mvc.perform(get("/api/reportes/detalle?tipo=ventas").cookie(session(admin))).andExpect(status().isOk()).andExpect(jsonPath("$.rows").isArray());
        mvc.perform(get("/api/inventario/kardex/datos-exportacion").cookie(session(seller))).andExpect(status().isOk()).andExpect(content().json("[]"));
    }
}
