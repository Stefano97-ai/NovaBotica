const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('dotenv').config();
require('reflect-metadata');
const { DatabaseService } = require('../dist/shared/database/database.service');
const db = new DatabaseService();
before(() => db.onModuleInit());
after(() => db.onModuleDestroy());

test('NestJS responde salud de base de datos por HTTP', async () => {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../dist/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    app.setGlobalPrefix('api');
    await app.listen(0, '127.0.0.1');
    const response = await fetch(`${await app.getUrl()}/api/health/db`);
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{status:'ok', database:'connected', migration:'001_initial.sql'});
  } finally { await app.close(); }
});

test('El servicio revierte todas las escrituras si falla la operación', async () => {
  const name = `rollback-${randomUUID()}`;
  await assert.rejects(db.transaction(async client => {
    await client.query('INSERT INTO categoria(nombre) VALUES ($1)', [name]);
    throw new Error('fallo intencional');
  }), /fallo intencional/);
  assert.equal((await db.query('SELECT 1 FROM categoria WHERE nombre=$1',[name])).rowCount,0);
});

test('El servicio confirma escrituras y libera la conexión', async () => {
  const name = `commit-${randomUUID()}`;
  try {
    await db.transaction(client => client.query('INSERT INTO categoria(nombre) VALUES ($1)',[name]));
    assert.equal((await db.query('SELECT 1 FROM categoria WHERE nombre=$1',[name])).rowCount,1);
  } finally { await db.query('DELETE FROM categoria WHERE nombre=$1',[name]); }
});

test('Restricciones y stock vendible sobre PostgreSQL real', async () => {
  const rollback = new Error('revertir fixtures');
  try {
    await db.transaction(async client => {
      const one = async (sql, params=[]) => (await client.query(sql, params)).rows[0];
      async function rejects(sql, params, code) {
        await client.query('SAVEPOINT invalid_case');
        try { await assert.rejects(client.query(sql,params), error => error.code===code); }
        finally { await client.query('ROLLBACK TO SAVEPOINT invalid_case'); await client.query('RELEASE SAVEPOINT invalid_case'); }
      }
      const cat=await one('INSERT INTO categoria(nombre) VALUES ($1) RETURNING id',[randomUUID()]);
      const prod=await one('INSERT INTO producto(categoria_id,codigo,nombre,precio_venta) VALUES ($1,$2,$3,10) RETURNING id',[cat.id,randomUUID(),'Prueba']);
      const second=await one('INSERT INTO producto(categoria_id,codigo,nombre,precio_venta) VALUES ($1,$2,$3,10) RETURNING id',[cat.id,randomUUID(),'Otro']);
      const lot=await one("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual) VALUES ($1,'VIGENTE',(now() AT TIME ZONE 'America/Lima')::date,30) RETURNING id",[prod.id]);
      await client.query("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual) VALUES ($1,'VENCIDO',(now() AT TIME ZONE 'America/Lima')::date-1,50)",[prod.id]);
      await client.query("INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual,disponible) VALUES ($1,'BLOQUEADO',(now() AT TIME ZONE 'America/Lima')::date+1,20,false)",[prod.id]);
      assert.equal((await one('SELECT cantidad FROM stock_disponible WHERE producto_id=$1',[prod.id])).cantidad,'30');
      await rejects('UPDATE lote SET stock_actual=-1 WHERE id=$1',[lot.id],'23514');
      const user=await one("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,$1,'Prueba','NO_ES_UNA_CREDENCIAL' FROM rol WHERE codigo='ADMINISTRADOR' RETURNING id",[randomUUID()]);
      const key=randomUUID();
      const sale=await one('INSERT INTO venta(usuario_id,subtotal,impuesto,total,clave_idempotencia,solicitud_hash) VALUES ($1,10,0,10,$2,$3) RETURNING id',[user.id,key,'a'.repeat(64)]);
      await rejects('INSERT INTO venta(usuario_id,subtotal,impuesto,total,clave_idempotencia,solicitud_hash) VALUES ($1,10,0,10,$2,$3)',[user.id,key,'a'.repeat(64)],'23505');
      const detail=await one("INSERT INTO detalle_venta(venta_id,producto_id,descripcion,cantidad,precio_unitario,tasa_impuesto,subtotal,impuesto,total) VALUES ($1,$2,'Prueba',1,10,0,10,0,10) RETURNING id",[sale.id,second.id]);
      await rejects('INSERT INTO detalle_venta_lote(detalle_venta_id,producto_id,lote_id,cantidad) VALUES ($1,$2,$3,1)',[detail.id,second.id,lot.id],'23503');
      const series=await one('SELECT id FROM serie_comprobante ORDER BY id LIMIT 1');
      // Negative cases use a new series, avoiding conflicts with actual documents.
      const fresh=await one('INSERT INTO serie_comprobante(tipo_comprobante_id,serie) SELECT tipo_comprobante_id,$1 FROM serie_comprobante WHERE id=$2 RETURNING id',[randomUUID().slice(0,20),series.id]);
      await client.query("INSERT INTO comprobante(venta_id,serie_comprobante_id,correlativo,datos_documento) VALUES ($1,$2,1,'{}')",[sale.id,fresh.id]);
      const sale2=await one('INSERT INTO venta(usuario_id,subtotal,impuesto,total,clave_idempotencia,solicitud_hash) VALUES ($1,10,0,10,$2,$3) RETURNING id',[user.id,randomUUID(),'b'.repeat(64)]);
      await rejects("INSERT INTO comprobante(venta_id,serie_comprobante_id,correlativo,datos_documento) VALUES ($1,$2,1,'{}')",[sale2.id,fresh.id],'23505');
      throw rollback;
    });
  } catch(error) { if(error !== rollback) throw error; }
});
