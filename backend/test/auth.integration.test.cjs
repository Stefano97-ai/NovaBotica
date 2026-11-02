const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID,randomInt}=require('node:crypto');
require('reflect-metadata');require('dotenv').config();
const {NestFactory}=require('@nestjs/core');
const {Controller,Get,Module,ValidationPipe}=require('@nestjs/common');
const {AppModule}=require('../dist/app.module');
const {DatabaseService}=require('../dist/shared/database/database.service');
const {hashPassword}=require('../dist/modules/auth/password');
const {Roles}=require('../dist/modules/auth/auth.guard');
const {tokenHash}=require('../dist/modules/auth/auth.service');

class ProbeController {admin(){return {ok:true};}}
Controller('test-admin')(ProbeController);
Get()(ProbeController.prototype,'admin',Object.getOwnPropertyDescriptor(ProbeController.prototype,'admin'));
Roles('ADMINISTRADOR')(ProbeController.prototype,'admin',Object.getOwnPropertyDescriptor(ProbeController.prototype,'admin'));
class TestModule {}
Module({imports:[AppModule],controllers:[ProbeController]})(TestModule);

test('Autenticación HTTP: sesión, CSRF, roles, revocación y límites',async t=>{
  const app=await NestFactory.create(TestModule,{logger:false});
  // Trust proxy only in this isolated test to scope the rate limit to a test IP.
  app.getHttpAdapter().getInstance().set('trust proxy',true);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
  await app.listen(0,'127.0.0.1');
  const db=app.get(DatabaseService);
  const base=await app.getUrl();
  const username='test-'+randomUUID();const missing='missing-'+randomUUID();
  const ip=`198.18.${randomInt(1,255)}.${randomInt(1,255)}`;
  const password='Una contraseña de prueba '+randomUUID();
  const result=await db.query("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,$1,'Prueba de acceso',$2 FROM rol WHERE codigo='VENDEDOR' RETURNING id",[username,await hashPassword(password)]);
  const userId=result.rows[0].id;
  const send=(path,body,cookie,extra={})=>fetch(base+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Nova-Client':'web','Origin':'http://localhost:5173','X-Forwarded-For':ip,...(cookie?{Cookie:cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
  let cookie;
  try {
    await t.test('Las rutas privadas rechazan solicitudes sin sesión',async()=>{assert.equal((await send('auth/me')).status,401);assert.equal((await send('test-admin')).status,401);});
    await t.test('Credenciales incorrectas y cuenta inexistente tienen el mismo error',async()=>{
      const wrong=await send('auth/login',{username,password:'incorrecta'});const absent=await send('auth/login',{username:missing,password});
      assert.equal(wrong.status,401);assert.equal(absent.status,401);assert.equal((await wrong.json()).message,(await absent.json()).message);assert.equal(wrong.headers.get('set-cookie'),null);
    });
    await t.test('DTO y origen no admiten entradas inválidas',async()=>{
      assert.equal((await send('auth/login',{username:[],password})).status,400);
      assert.equal((await send('auth/login',{username,password,rol:'ADMINISTRADOR'})).status,400);
      assert.equal((await send('auth/login',{username,password},undefined,{Origin:'https://otro.example'})).status,403);
      assert.equal((await send('auth/login',{username,password},undefined,{'X-Nova-Client':''})).status,403);
    });
    await t.test('Login crea cookie HttpOnly y guarda solo el hash del token',async()=>{
      const response=await send('auth/login',{username:' '+username.toUpperCase()+' ',password});assert.equal(response.status,200);
      const setCookie=response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/SameSite=Strict/i);assert.match(setCookie,/Max-Age=28800/);
      cookie=setCookie.split(';')[0];const token=cookie.split('=')[1];
      const payload=await response.json();assert.equal(payload.user.rol,'VENDEDOR');assert.equal(payload.user.password_hash,undefined);assert.equal(payload.token,undefined);
      const session=await db.query('SELECT token_hash FROM sesion WHERE usuario_id=$1',[userId]);assert.equal(session.rows[0].token_hash,tokenHash(token));assert.notEqual(session.rows[0].token_hash,token);
      assert.equal((await send('auth/me',undefined,cookie)).status,200);
    });
    await t.test('Un vendedor no puede acceder a una operación de administrador',async()=>{assert.equal((await send('test-admin',undefined,cookie)).status,403);});
    await t.test('Login renueva sesión y revoca el token anterior',async()=>{
      const previous=cookie;const response=await send('auth/login',{username,password},cookie);assert.equal(response.status,200);cookie=response.headers.get('set-cookie').split(';')[0];assert.notEqual(cookie,previous);assert.equal((await send('auth/me',undefined,previous)).status,401);
    });
    await t.test('Desactivar la cuenta invalida el acceso existente y nuevo',async()=>{
      await db.query('UPDATE usuario SET activo=false WHERE id=$1',[userId]);
      assert.equal((await send('auth/me',undefined,cookie)).status,401);assert.equal((await send('auth/login',{username,password})).status,401);
      await db.query('UPDATE usuario SET activo=true WHERE id=$1',[userId]);
    });
    await t.test('Logout revoca la sesión incluso si se reutiliza su cookie',async()=>{const response=await send('auth/logout',{},cookie);assert.equal(response.status,204);assert.match(response.headers.get('set-cookie'),/Expires=Thu, 01 Jan 1970/);assert.equal((await send('auth/me',undefined,cookie)).status,401);});
    await t.test('Una sesión vencida es rechazada',async()=>{
      const hash=tokenHash('f'.repeat(64));await db.query("INSERT INTO sesion(token_hash,usuario_id,creada_en,expira_en) VALUES ($1,$2,now()-interval '2 hours',now()-interval '1 hour')",[hash,userId]);
      assert.equal((await send('auth/me',undefined,'nova_session='+'f'.repeat(64))).status,401);
    });
    await t.test('El límite de intentos se aplica en la base de datos',async()=>{
      await db.query("INSERT INTO acceso_limite(clave,intentos,expira_en) VALUES ($1,10,now()+interval '15 minutes') ON CONFLICT(clave) DO UPDATE SET intentos=10,expira_en=excluded.expira_en",[tokenHash('account:'+username)]);
      assert.equal((await send('auth/login',{username,password})).status,429);
    });
  } finally {
    await db.query('DELETE FROM sesion WHERE usuario_id=$1',[userId]);
    await db.query('DELETE FROM usuario WHERE id=$1',[userId]);
    await db.query('DELETE FROM acceso_limite WHERE clave=ANY($1::text[])',[[tokenHash('ip:'+ip),tokenHash('account:'+username),tokenHash('account:'+missing)]]);
    await app.close();
  }
});
