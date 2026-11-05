-- Run with psql -v ON_ERROR_STOP=1 on an isolated migrated database.
BEGIN;
CREATE FUNCTION pg_temp.expect_error(statement text, expected text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE=expected THEN RETURN; END IF;
    RAISE;
  END;
  RAISE EXCEPTION 'Expected SQLSTATE %, statement succeeded: %',expected,statement;
END $$;
DO $$
DECLARE category bigint; p1 bigint; p2 bigint; actor bigint; supplier bigint;
  purchase bigint; line1 bigint; line2 bigint; lot1 bigint; lot2 bigint;
  sale bigint; sale_line bigint; allocation bigint; unit1 bigint; unit2 bigint;
BEGIN
  SELECT id INTO actor FROM usuario ORDER BY id LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'The test database needs one existing user'; END IF;
  INSERT INTO categoria(nombre) VALUES('ER test category') RETURNING id INTO category;
  INSERT INTO producto(categoria_id,codigo,nombre,unidad_base,precio_venta)
    VALUES(category,'ER-TEST-1','Test one','CAJA',11.80) RETURNING id INTO p1;
  INSERT INTO producto(categoria_id,codigo,nombre,precio_venta)
    VALUES(category,'ER-TEST-2','Test two',11.80) RETURNING id INTO p2;
  IF (SELECT presentacion FROM producto WHERE id=p1)<>'CAJA' THEN RAISE EXCEPTION 'Presentation alias'; END IF;
  INSERT INTO proveedor(ruc,razon_social) VALUES('99999999999','ER test supplier') RETURNING id INTO supplier;
  INSERT INTO compra(proveedor_id,usuario_id,total) VALUES(supplier,actor,10) RETURNING id INTO purchase;
  INSERT INTO detalle_compra(compra_id,producto_id,cantidad,costo_unitario)
    VALUES(purchase,p1,2,2.50) RETURNING id INTO line1;
  INSERT INTO detalle_compra(compra_id,producto_id,cantidad,costo_unitario)
    VALUES(purchase,p2,2,2.50) RETURNING id INTO line2;
  IF (SELECT subtotal FROM detalle_compra WHERE id=line1)<>5 THEN RAISE EXCEPTION 'Purchase subtotal'; END IF;
  INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual)
    VALUES(p1,'ER-LOT-1',CURRENT_DATE+100,2) RETURNING id INTO lot1;
  INSERT INTO lote(producto_id,numero_lote,fecha_vencimiento,stock_actual)
    VALUES(p2,'ER-LOT-2',CURRENT_DATE+100,2) RETURNING id INTO lot2;
  INSERT INTO venta(usuario_id,subtotal,impuesto,total,clave_idempotencia,solicitud_hash)
    VALUES(actor,10,1.80,11.80,gen_random_uuid(),repeat('a',64)) RETURNING id INTO sale;
  IF (SELECT igv FROM venta WHERE id=sale)<>1.80 THEN RAISE EXCEPTION 'IGV alias'; END IF;
  INSERT INTO detalle_venta(venta_id,producto_id,descripcion,cantidad,precio_unitario,tasa_impuesto,subtotal,impuesto,total)
    VALUES(sale,p1,'Test',1,11.80,.18,10,1.80,11.80) RETURNING id INTO sale_line;
  INSERT INTO detalle_venta_lote(detalle_venta_id,producto_id,lote_id,cantidad)
    VALUES(sale_line,p1,lot1,1) RETURNING id INTO allocation;

  INSERT INTO unidad_serializada(lote_id,detalle_compra_id,numero_serie,codigo_escaneado)
    VALUES(lot1,line1,'ER-SERIAL-1','barcode-1') RETURNING id INTO unit1;
  INSERT INTO unidad_serializada(lote_id,detalle_compra_id,numero_serie)
    VALUES(lot1,line1,'ER-SERIAL-2') RETURNING id INTO unit2;
  PERFORM pg_temp.expect_error(format('INSERT INTO unidad_serializada(lote_id,detalle_compra_id,numero_serie) VALUES(%s,%s,''OVER-CAPACITY'')',lot1,line1),'23514');
  PERFORM pg_temp.expect_error(format('INSERT INTO unidad_serializada(lote_id,detalle_compra_id,numero_serie) VALUES(%s,%s,''WRONG-PRODUCT'')',lot2,line1),'23514');
  -- A separate unused line has spare capacity; the composite FK must reject a product mismatch.
  PERFORM pg_temp.expect_error(format('INSERT INTO unidad_serializada(lote_id,detalle_compra_id,numero_serie) VALUES(%s,%s,''WRONG-FK'')',lot1,line2),'23503');
  PERFORM pg_temp.expect_error(format('INSERT INTO unidad_serializada(lote_id,detalle_compra_id,numero_serie) VALUES(%s,%s,''ER-SERIAL-1'')',lot2,line2),'23505');
  UPDATE unidad_serializada SET estado='VENDIDA',asignacion_id=allocation WHERE id=unit1;
  PERFORM pg_temp.expect_error(format('UPDATE unidad_serializada SET estado=''VENDIDA'',asignacion_id=%s WHERE id=%s',allocation,unit2),'23514');
  PERFORM pg_temp.expect_error(format('UPDATE unidad_serializada SET estado=''DISPONIBLE'' WHERE id=%s',unit1),'23514');
  PERFORM pg_temp.expect_error(format('UPDATE detalle_compra SET cantidad=1 WHERE id=%s',line1),'23514');
  PERFORM pg_temp.expect_error(format('UPDATE lote SET producto_id=%s WHERE id=%s',p2,lot1),'23503');
  PERFORM pg_temp.expect_error(format('UPDATE detalle_venta_lote SET lote_id=%s,producto_id=%s WHERE id=%s',lot2,p2,allocation),'23503');

  INSERT INTO movimiento(lote_id,usuario_id,tipo,cantidad,motivo,referencia,venta_id,saldo_anterior,saldo_posterior)
    VALUES(lot1,actor,'SALIDA',-1,'Test','Test',sale,2,1);
  IF NOT EXISTS(SELECT 1 FROM movimiento WHERE lote_id=lot1 AND origen_tipo='VENTA' AND origen_id=sale AND tipo_movimiento='SALIDA') THEN
    RAISE EXCEPTION 'Movement origin'; END IF;
  PERFORM pg_temp.expect_error(format('INSERT INTO movimiento(lote_id,usuario_id,tipo,cantidad,motivo,referencia,saldo_anterior,saldo_posterior) VALUES(%s,%s,''AJUSTE'',1,''Test'',''Test'',2,8)',lot1,actor),'23514');
  RAISE NOTICE 'PASS: aliases, serial uniqueness, product/lot FKs, capacity and movement balances';
END $$;
ROLLBACK;
