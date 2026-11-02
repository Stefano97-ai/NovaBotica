const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
require('reflect-metadata');require('dotenv').config();
const {DatabaseService}=require('../dist/shared/database/database.service');
const {InicioRepository}=require('../dist/modules/inicio/inicio.repository');
test('Inicio: stock vendible, límites de vencimiento y privacidad por rol',async()=>{
 const db=new DatabaseService();await db.onModuleInit();
 const rollback=new Error('fixture rollback');
 try {await assert.rejects(db.transaction(async client=>{
  const repository=new InicioRepository(client);const code=randomUUID();
  const before=await repository.summary('0','ADMINISTRADOR');
  const category=await client.query("INSERT INTO categoria(nombre) VALUES($1) RETURNING id",[code]);
  const p=await client.query("INSERT INTO producto(codigo,nombre,precio_venta,stock_minimo,categoria_id) VALUES($1,'Test inicio',10,5,$2) RETURNING id",[code,category.rows[0].id]);
  const id=p.rows[0].id;
  await client.query("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual) VALUES ($1,'hoy',CURRENT_DATE,2),($1,'30',CURRENT_DATE+30,2),($1,'31',CURRENT_DATE+31,1),($1,'vencido',CURRENT_DATE-1,100)",[id]);
  const result=await repository.summary('0','ADMINISTRADOR');
  assert.equal(result.products,before.products+1);assert.equal(result.lowStock,before.lowStock+1);
  assert.equal(result.expiringCount,before.expiringCount+2);assert.equal(result.expired,before.expired+1);
  assert.equal((await repository.summary('0','ALMACENERO')).sales,null);
  const u=await client.query("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,$1,'Test','unused' FROM rol WHERE codigo='VENDEDOR' RETURNING id",[code]);
  await client.query("INSERT INTO venta(usuario_id,subtotal,impuesto,total,clave_idempotencia,solicitud_hash) VALUES($1,10,0,10,$2,$3)",[u.rows[0].id,randomUUID(),'a'.repeat(64)]);
  assert.deepEqual((await repository.summary(u.rows[0].id,'VENDEDOR')).sales,{count:1,total:'10.00'});
  assert.equal((await repository.summary('0','VENDEDOR')).sales.count,0);
  throw rollback;
 }),e=>e===rollback);}finally{await db.onModuleDestroy()}
});
