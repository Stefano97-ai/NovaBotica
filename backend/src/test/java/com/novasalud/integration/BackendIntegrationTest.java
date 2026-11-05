package com.novasalud.integration;
import com.novasalud.auth.PasswordService;
import com.novasalud.inicio.repository.InicioRepository;
import com.novasalud.shared.database.DatabaseMigration;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.sql.DataSource;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.bind.annotation.*;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import jakarta.servlet.http.Cookie;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class BackendIntegrationTest {
 @Container static final PostgreSQLContainer<?> database=new PostgreSQLContainer<>("postgres:18-bookworm").withDatabaseName("nova_test").withUsername("test").withPassword("test");
 @DynamicPropertySource static void properties(DynamicPropertyRegistry registry){registry.add("DATABASE_URL",()->"postgresql://test:test@"+database.getHost()+":"+database.getMappedPort(5432)+"/nova_test");registry.add("nova.create-admin",()->false);}
 @TestConfiguration static class TestEndpoints {@Bean Probe probe(){return new Probe();}}
 @RestController static class Probe {@GetMapping("/api/test-admin") @PreAuthorize("hasRole('ADMINISTRADOR')") Map<String,Boolean> admin(){return Map.of("ok",true);}}
 @Autowired MockMvc mvc;@Autowired JdbcTemplate jdbc;@Autowired PasswordService passwords;@Autowired ObjectMapper json;@Autowired InicioRepository inicio;@Autowired DataSource source;
 String username;long userId;String password="Contraseña de prueba";
 MockHttpServletRequestBuilder postWeb(String path){return post(path).header("X-Nova-Client","web").header("Origin","http://localhost:5173").contentType("application/json");}
 String body(String name,String pass)throws Exception{return json.writeValueAsString(Map.of("username",name,"password",pass));}
 Cookie login(Cookie previous)throws Exception{
  var request=postWeb("/api/auth/login").content(body(" "+username.toUpperCase(Locale.ROOT)+" ",password));if(previous!=null)request.cookie(previous);
  var result=mvc.perform(request).andExpect(status().isOk()).andExpect(jsonPath("$.user.id").isString()).andExpect(jsonPath("$.user.password_hash").doesNotExist()).andReturn();
  String header=result.getResponse().getHeader("Set-Cookie");assertTrue(header.contains("HttpOnly"));assertTrue(header.contains("SameSite=Strict"));assertTrue(header.contains("Max-Age=28800"));
  return new Cookie("nova_session",header.split(";",2)[0].split("=",2)[1]);
 }
 @BeforeEach void setup(){jdbc.update("DELETE FROM acceso_limite");username="java-"+UUID.randomUUID();userId=jdbc.queryForObject("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,?,'Test Java',? FROM rol WHERE codigo='VENDEDOR' RETURNING id",Long.class,username,passwords.hash(password));}
 @AfterEach void cleanup(){jdbc.update("DELETE FROM sesion WHERE usuario_id=?",userId);jdbc.update("DELETE FROM venta WHERE usuario_id=?",userId);jdbc.update("DELETE FROM usuario WHERE id=?",userId);}
 @Test void authContractAndRevocation()throws Exception{
  mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/health/db")).andExpect(status().isOk()).andExpect(jsonPath("$.migration").value("006_producto_imagen.sql"));
  mvc.perform(postWeb("/api/auth/login").content(body(username,"incorrecta"))).andExpect(status().isUnauthorized());
  mvc.perform(postWeb("/api/auth/login").content(body("inexistente",password))).andExpect(status().isUnauthorized());
  Cookie first=login(null);
  assertEquals(PasswordService.sha256(first.getValue()),jdbc.queryForObject("SELECT token_hash FROM sesion WHERE usuario_id=?",String.class,userId));
  mvc.perform(get("/api/auth/me").cookie(first)).andExpect(status().isOk());
  mvc.perform(get("/api/test-admin").cookie(first)).andExpect(status().isForbidden());
  Cookie second=login(first);mvc.perform(get("/api/auth/me").cookie(first)).andExpect(status().isUnauthorized());
  jdbc.update("UPDATE usuario SET activo=false WHERE id=?",userId);
  mvc.perform(get("/api/auth/me").cookie(second)).andExpect(status().isUnauthorized());
  mvc.perform(postWeb("/api/auth/login").content(body(username,password))).andExpect(status().isUnauthorized());
  jdbc.update("UPDATE usuario SET activo=true WHERE id=?",userId);
  mvc.perform(postWeb("/api/auth/logout").cookie(second)).andExpect(status().isNoContent());
  mvc.perform(get("/api/auth/me").cookie(second)).andExpect(status().isUnauthorized());
 }
 @Test void validationOriginLimitsAndExpiry()throws Exception{
  mvc.perform(post("/api/auth/login").contentType("application/json").content(body(username,password))).andExpect(status().isForbidden());
  mvc.perform(post("/api/auth/login").header("X-Nova-Client","web").header("Origin","https://other.example").contentType("application/json").content(body(username,password))).andExpect(status().isForbidden());
  mvc.perform(postWeb("/api/auth/login").content("{\"username\":123,\"password\":\"x\"}")).andExpect(status().isBadRequest());
  mvc.perform(postWeb("/api/auth/login").content("{\"username\":\"x\",\"password\":\"x\",\"rol\":\"ADMINISTRADOR\"}")).andExpect(status().isBadRequest());
  Cookie cookie=login(null);jdbc.update("UPDATE sesion SET creada_en=now()-interval '2 hours',expira_en=now()-interval '1 hour' WHERE usuario_id=?",userId);
  mvc.perform(get("/api/auth/me").cookie(cookie)).andExpect(status().isUnauthorized());
  jdbc.update("UPDATE acceso_limite SET intentos=10 WHERE clave=?",PasswordService.sha256("account:"+username));
  mvc.perform(postWeb("/api/auth/login").content(body(username,password))).andExpect(status().isTooManyRequests());
 }
 @Test void acceptsExistingSessionAndSalesIsolation()throws Exception{
  String token="a".repeat(64);jdbc.update("INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES(?,?,now()+interval '8 hours')",PasswordService.sha256(token),userId);
  Cookie cookie=new Cookie("nova_session",token);mvc.perform(get("/api/inicio").cookie(cookie)).andExpect(status().isOk()).andExpect(jsonPath("$.sales.total").value("0"));
  jdbc.update("INSERT INTO venta(usuario_id,subtotal,impuesto,total,clave_idempotencia,solicitud_hash) VALUES(?,10,0,10,?::uuid,?)",userId,UUID.randomUUID().toString(),"a".repeat(64));
  assertEquals("10.00",inicio.summary(Long.toString(userId),"VENDEDOR").sales().total());
  assertEquals(0,inicio.summary("0","VENDEDOR").sales().count());assertNull(inicio.summary("0","ALMACENERO").sales());
  assertEquals("10.00",inicio.summary("0","ADMINISTRADOR").sales().total());
 }
 @Test void inventoryBoundariesAndMigrationCompatibility()throws Exception{
  var before=inicio.summary("0","ADMINISTRADOR");
  long category=jdbc.queryForObject("INSERT INTO categoria(nombre) VALUES (?) RETURNING id",Long.class,UUID.randomUUID().toString());
  long product=jdbc.queryForObject("INSERT INTO producto(categoria_id,codigo,nombre,precio_venta,stock_minimo) VALUES(?,?,'Prueba',10,5) RETURNING id",Long.class,category,UUID.randomUUID().toString());
  try{
   jdbc.update("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual) VALUES(?,'hoy',CURRENT_DATE,2),(?,'30',CURRENT_DATE+30,2),(?,'31',CURRENT_DATE+31,1),(?,'vencido',CURRENT_DATE-1,99)",product,product,product,product);
   var after=inicio.summary("0","ADMINISTRADOR");assertEquals(before.lowStock()+1,after.lowStock());assertEquals(before.expiringCount()+2,after.expiringCount());assertEquals(before.expired()+1,after.expired());
   var migrator=new DatabaseMigration(source);migrator.afterPropertiesSet();assertEquals(6,jdbc.queryForObject("SELECT count(*) FROM schema_migrations",Integer.class));
   jdbc.update("UPDATE schema_migrations SET checksum='wrong' WHERE version='002_auth.sql'");
   try{assertThrows(IllegalStateException.class,migrator::afterPropertiesSet);}finally{byte[] bytes=getClass().getResourceAsStream("/database/migrations/002_auth.sql").readAllBytes();jdbc.update("UPDATE schema_migrations SET checksum=? WHERE version='002_auth.sql'",java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(bytes)));}
  }finally{jdbc.update("DELETE FROM lote WHERE producto_id=?",product);jdbc.update("DELETE FROM producto WHERE id=?",product);jdbc.update("DELETE FROM categoria WHERE id=?",category);}
 }
 @Test void transactionRollbackAndCommit(){
  var tx=new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(source));
  String marker="transaction-"+UUID.randomUUID();
  assertThrows(IllegalStateException.class,()->tx.executeWithoutResult(status->{jdbc.update("INSERT INTO categoria(nombre) VALUES(?)",marker);throw new IllegalStateException("rollback");}));
  assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM categoria WHERE nombre=?",Integer.class,marker));
  tx.executeWithoutResult(status->jdbc.update("INSERT INTO categoria(nombre) VALUES(?)",marker));
  assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM categoria WHERE nombre=?",Integer.class,marker));jdbc.update("DELETE FROM categoria WHERE nombre=?",marker);
 }
 @Test void adminBootstrapCreatesOnceWithoutChangingPassword()throws Exception{
  var file=java.nio.file.Files.createTempDirectory("nova-admin-test").resolve("credentials.txt");
  var tx=new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(source));
  var bootstrap=new com.novasalud.auth.AdminBootstrap(jdbc,tx,passwords,true,file.toString(),"");
  try{
   bootstrap.run(new org.springframework.boot.DefaultApplicationArguments());
   String first=java.nio.file.Files.readString(file);String hash=jdbc.queryForObject("SELECT password_hash FROM usuario WHERE username='admin'",String.class);
   String credential=first.split("Contraseña: ")[1].trim();assertTrue(passwords.verify(credential,hash));
   bootstrap.run(new org.springframework.boot.DefaultApplicationArguments());
   assertEquals(first,java.nio.file.Files.readString(file));assertEquals(hash,jdbc.queryForObject("SELECT password_hash FROM usuario WHERE username='admin'",String.class));
  }finally{jdbc.update("DELETE FROM usuario WHERE username='admin'");java.nio.file.Files.deleteIfExists(file);java.nio.file.Files.deleteIfExists(file.getParent());}
 }
}
