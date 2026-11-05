-- Optional local demonstration data. Never part of application startup or migrations.
-- All prices, identities and operations are fictitious. No tax-valid documents are issued.
\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('nova-salud-demo-v1'));
SET LOCAL TIME ZONE 'America/Lima';

DO $seed$
DECLARE
  today date := (now() AT TIME ZONE 'America/Lima')::date;
  admin_id bigint; seller_id bigint; operator_id bigint;
  suppliers bigint[] := '{}'; clients bigint[] := '{}'; products bigint[] := '{}';
  category_id bigint; supplier_id bigint; customer_id bigint; product_id bigint;
  purchase_id bigint; purchase_line_id bigint; lot_id bigint; receipt_id bigint;
  sale_id bigint; sale_line_id bigint; series_id bigint; sequence_number bigint;
  used_products bigint[];
  catalog record; item record; selected_lot record;
  stage int; supplier_index int; i int; d int; operation int; j int;
  quantity int; initial_quantity int; pending int; taken int; operations int;
  gross numeric(14,2); net numeric(14,2); tax numeric(14,2); unit_cost numeric(14,2);
  purchase_total numeric(14,2); sale_total numeric(14,2); sale_net numeric(14,2);
  happened_at timestamptz; received_on date; expires_on date;
  doc_type text; payment_method text; document jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM producto WHERE codigo LIKE 'DEMO-NS-%') THEN
    RAISE NOTICE 'El conjunto DEMO-NS ya existe; no se añaden ni modifican registros.';
    RETURN;
  END IF;
  SELECT u.id INTO admin_id FROM usuario u JOIN rol r ON r.id=u.rol_id
    WHERE u.activo AND r.codigo='ADMINISTRADOR' ORDER BY u.id LIMIT 1;
  SELECT u.id INTO seller_id FROM usuario u JOIN rol r ON r.id=u.rol_id
    WHERE u.activo AND r.codigo='VENDEDOR' ORDER BY u.id LIMIT 1;
  IF admin_id IS NULL OR seller_id IS NULL THEN
    RAISE EXCEPTION 'Se requiere un administrador y un vendedor activos; no se crean ni cambian credenciales.';
  END IF;

  -- Synthetic identifiers deliberately do not represent real people or companies.
  FOR i IN 1..4 LOOP
    INSERT INTO proveedor(ruc,razon_social,correo,direccion)
      VALUES('0000000000'||i, (ARRAY['Distribuidora Central DEMO','Suministros Médicos Andinos DEMO',
        'Bienestar y Cuidado DEMO','Equipamiento Salud DEMO'])[i],
        'proveedor'||i||'@nova-salud.invalid','Dirección ficticia de demostración, Lima') RETURNING id INTO supplier_id;
    suppliers := array_append(suppliers,supplier_id);
  END LOOP;
  FOR i IN 1..12 LOOP
    INSERT INTO cliente(tipo_documento,numero_documento,nombre)
      VALUES(CASE WHEN i<=9 THEN 'DNI' ELSE 'RUC' END,
        CASE WHEN i<=9 THEN lpad(i::text,8,'0') ELSE lpad(i::text,11,'0') END,
        CASE WHEN i<=9 THEN 'Cliente de demostración ' ELSE 'Empresa de demostración ' END||lpad(i::text,2,'0'))
      RETURNING id INTO customer_id;
    clients := array_append(clients,customer_id);
  END LOOP;

  FOR catalog IN SELECT * FROM (VALUES
    (1,'Analgésicos','Paracetamol 500 mg · caja x 20','CAJA',5.50,25),
    (2,'Analgésicos','Ibuprofeno 400 mg · caja x 10','CAJA',7.80,20),
    (3,'Antialérgicos','Loratadina 10 mg · caja x 10','CAJA',6.50,18),
    (4,'Cuidado digestivo','Omeprazol 20 mg · caja x 14','CAJA',12.90,15),
    (5,'Primeros auxilios','Gasas estériles · paquete x 10','PAQUETE',4.50,20),
    (6,'Analgésicos','Paracetamol 120 mg/5 ml · frasco 60 ml','FRASCO',8.90,15),
    (7,'Vitaminas y suplementos','Vitamina C 1 g · tubo x 10','TUBO',14.50,20),
    (8,'Higiene y cuidado personal','Alcohol medicinal 70 % · frasco 250 ml','FRASCO',6.90,25),
    (9,'Cuidado digestivo','Sales de rehidratación oral · sobre','SOBRE',2.80,30),
    (10,'Primeros auxilios','Mascarillas quirúrgicas · caja x 50','CAJA',12.00,12),
    (11,'Antialérgicos','Cetirizina 10 mg · caja x 10','CAJA',9.50,15),
    (12,'Cuidado respiratorio','Solución salina 0.9 % · frasco 100 ml','FRASCO',5.90,18),
    (13,'Cuidado respiratorio','Pastillas para la garganta · caja x 12','CAJA',8.50,18),
    (14,'Vitaminas y suplementos','Complejo B · caja x 30','CAJA',18.90,12),
    (15,'Vitaminas y suplementos','Zinc 20 mg · frasco x 30','FRASCO',22.50,10),
    (16,'Higiene y cuidado personal','Protector solar FPS 50 · tubo 50 ml','TUBO',39.90,10),
    (17,'Higiene y cuidado personal','Jabón líquido neutro · frasco 250 ml','FRASCO',11.90,15),
    (18,'Primeros auxilios','Vendas elásticas 4 pulgadas · unidad','UNIDAD',7.50,15),
    (19,'Primeros auxilios','Apósitos adhesivos · caja x 20','CAJA',5.90,20),
    (20,'Cuidado digestivo','Simeticona 80 mg · caja x 20','CAJA',13.50,12),
    (21,'Cuidado infantil','Crema protectora para bebé · tubo 60 g','TUBO',17.90,10),
    (22,'Cuidado infantil','Toallitas húmedas · paquete x 80','PAQUETE',9.90,18),
    (23,'Dispositivos médicos','Termómetro digital · unidad','UNIDAD',18.50,8),
    (24,'Dispositivos médicos','Oxímetro de pulso · unidad','UNIDAD',69.90,5)
  ) AS v(n,category,name,unit,price,minimum) ORDER BY n LOOP
    INSERT INTO categoria(nombre) VALUES(catalog.category) ON CONFLICT(nombre) DO NOTHING;
    SELECT id INTO category_id FROM categoria WHERE nombre=catalog.category;
    INSERT INTO producto(categoria_id,codigo,nombre,unidad_base,precio_venta,stock_minimo,creado_en)
      VALUES(category_id,'DEMO-NS-'||lpad(catalog.n::text,3,'0'),catalog.name,catalog.unit,catalog.price,catalog.minimum,
        (today-105)::timestamp AT TIME ZONE 'America/Lima') RETURNING id INTO product_id;
    products := array_append(products,product_id);
  END LOOP;

  -- Two purchase/receipt waves, recorded before the stock can be sold.
  FOR stage IN 1..2 LOOP
    received_on := today-CASE WHEN stage=1 THEN 100 ELSE 35 END;
    FOR supplier_index IN 1..4 LOOP
      INSERT INTO compra(proveedor_id,usuario_id,fecha,total,estado)
        VALUES(suppliers[supplier_index],admin_id,(received_on+time '07:00') AT TIME ZONE 'America/Lima',0,'RECIBIDA')
        RETURNING id INTO purchase_id;
      purchase_total := 0;
      FOR i IN 1..24 LOOP
        IF 1+(i-1)%4 <> supplier_index THEN CONTINUE; END IF;
        SELECT * INTO item FROM producto WHERE id=products[i];
        initial_quantity := CASE WHEN i<=5 THEN CASE WHEN stage=1 THEN 32 ELSE 8 END
          ELSE CASE WHEN stage=1 THEN 180+(i%5)*30 ELSE 140 END END;
        unit_cost := round(item.precio_venta*0.62,2);
        INSERT INTO detalle_compra(compra_id,producto_id,cantidad,costo_unitario)
          VALUES(purchase_id,item.id,initial_quantity,unit_cost) RETURNING id INTO purchase_line_id;
        expires_on := today+CASE WHEN stage=2 THEN 210+(i%4)*30
          ELSE CASE i%3 WHEN 0 THEN 15 WHEN 1 THEN 45 ELSE 75 END END;
        INSERT INTO lote(producto_id,numero_lote,fecha_ingreso,fecha_vencimiento,stock_actual)
          VALUES(item.id,'DEMO-NS-'||lpad(i::text,3,'0')||'-'||stage,received_on,expires_on,initial_quantity)
          RETURNING id INTO lot_id;
        INSERT INTO recepcion_lote(detalle_compra_id,producto_id,lote_id,usuario_id,cantidad_recibida,fecha,clave_idempotencia)
          VALUES(purchase_line_id,item.id,lot_id,admin_id,initial_quantity,
            (received_on+time '07:00') AT TIME ZONE 'America/Lima',gen_random_uuid()) RETURNING id INTO receipt_id;
        INSERT INTO movimiento(lote_id,usuario_id,fecha,tipo,cantidad,motivo,referencia,recepcion_lote_id,saldo_anterior,saldo_posterior)
          VALUES(lot_id,admin_id,(received_on+time '07:00') AT TIME ZONE 'America/Lima','ENTRADA',initial_quantity,
            'Recepción de compra de demostración','DEMO-NS-V1',receipt_id,0,initial_quantity);
        purchase_total := purchase_total+initial_quantity*unit_cost;
      END LOOP;
      UPDATE compra SET total=purchase_total WHERE id=purchase_id;
    END LOOP;
  END LOOP;

  -- Dedicated, inactive series keep demo numbering separate from normal POS issuance.
  INSERT INTO serie_comprobante(tipo_comprobante_id,serie,activo)
    SELECT id,CASE codigo WHEN 'BOLETA' THEN 'BDEM' ELSE 'FDEM' END,false
    FROM tipo_comprobante WHERE codigo IN ('BOLETA','FACTURA');

  FOR d IN REVERSE 89..0 LOOP
    operations := 6+((89-d)*7)%8;
    IF extract(isodow FROM today-d)=7 THEN operations := 4+d%3; END IF;
    FOR operation IN 1..operations LOOP
      happened_at := (today-d+make_time(8+(operation-1)*14/operations,(operation*13+d*7)%60,0)) AT TIME ZONE 'America/Lima';
      IF happened_at>now() THEN CONTINUE; END IF;
      operator_id := CASE WHEN operation%4=0 THEN admin_id ELSE seller_id END;
      doc_type := CASE WHEN operation%5=0 THEN 'FACTURA' ELSE 'BOLETA' END;
      customer_id := CASE WHEN doc_type='FACTURA' THEN clients[10+operation%3]
        WHEN operation%3=0 THEN NULL ELSE clients[1+(d+operation)%9] END;
      INSERT INTO venta(cliente_id,usuario_id,fecha,subtotal,impuesto,total,clave_idempotencia,solicitud_hash)
        VALUES(customer_id,operator_id,happened_at,0,0,0,gen_random_uuid(),repeat('d',64)) RETURNING id INTO sale_id;
      used_products := '{}'; sale_total := 0; sale_net := 0;
      FOR j IN 1..1+operation%3 LOOP
        i := CASE WHEN (operation+j)%3=0 THEN 6+(d+operation+j)%5 ELSE 1+(d*7+operation*3+j*5)%24 END;
        product_id := products[i];
        IF product_id=ANY(used_products) THEN CONTINUE; END IF;
        used_products := array_append(used_products,product_id);
        quantity := 1+(d+operation+j)%3;
        IF (SELECT COALESCE(sum(stock_actual),0) FROM lote WHERE producto_id=product_id AND disponible
            AND fecha_ingreso<=today-d AND fecha_vencimiento>=today-d)<quantity THEN CONTINUE; END IF;
        SELECT * INTO item FROM producto WHERE id=product_id;
        gross := round(item.precio_venta*quantity,2); net := round(gross/1.18,2); tax := gross-net;
        INSERT INTO detalle_venta(venta_id,producto_id,descripcion,cantidad,precio_unitario,tasa_impuesto,subtotal,impuesto,total)
          VALUES(sale_id,item.id,item.nombre,quantity,item.precio_venta,0.18,net,tax,gross) RETURNING id INTO sale_line_id;
        pending := quantity;
        FOR selected_lot IN SELECT * FROM lote WHERE producto_id=product_id AND disponible AND stock_actual>0
            AND fecha_ingreso<=today-d AND fecha_vencimiento>=today-d ORDER BY fecha_vencimiento,id FOR UPDATE LOOP
          EXIT WHEN pending=0;
          taken := least(pending,selected_lot.stock_actual);
          INSERT INTO detalle_venta_lote(detalle_venta_id,producto_id,lote_id,cantidad) VALUES(sale_line_id,product_id,selected_lot.id,taken);
          UPDATE lote SET stock_actual=stock_actual-taken WHERE id=selected_lot.id;
          INSERT INTO movimiento(lote_id,usuario_id,fecha,tipo,cantidad,motivo,referencia,venta_id,saldo_anterior,saldo_posterior)
            VALUES(selected_lot.id,operator_id,happened_at,'SALIDA',-taken,'Venta de demostración','DEMO-NS-V1',sale_id,
              selected_lot.stock_actual,selected_lot.stock_actual-taken);
          pending := pending-taken;
        END LOOP;
        IF pending<>0 THEN RAISE EXCEPTION 'No se pudo asignar stock FEFO'; END IF;
        sale_total := sale_total+gross; sale_net := sale_net+net;
      END LOOP;
      IF sale_total=0 THEN DELETE FROM venta WHERE id=sale_id; CONTINUE; END IF;
      UPDATE venta SET subtotal=sale_net,impuesto=sale_total-sale_net,total=sale_total WHERE id=sale_id;
      payment_method := (ARRAY['EFECTIVO','EFECTIVO','YAPE','TARJETA','PLIN'])[1+(d+operation)%5];
      INSERT INTO pago(venta_id,metodo,monto,referencia,fecha)
        VALUES(sale_id,payment_method,sale_total,'DEMO-NS-V1',happened_at);
      SELECT s.id INTO series_id FROM serie_comprobante s JOIN tipo_comprobante t ON t.id=s.tipo_comprobante_id
        WHERE t.codigo=doc_type AND s.serie=CASE WHEN doc_type='BOLETA' THEN 'BDEM' ELSE 'FDEM' END;
      UPDATE serie_comprobante SET ultimo_correlativo=ultimo_correlativo+1 WHERE id=series_id RETURNING ultimo_correlativo INTO sequence_number;
      document := jsonb_build_object('leyenda','DOCUMENTO DE DEMOSTRACIÓN - SIN VALIDEZ TRIBUTARIA','demo','DEMO-NS-V1',
        'botica','NOVA SALUD','tipo',doc_type,'serie',CASE WHEN doc_type='BOLETA' THEN 'BDEM' ELSE 'FDEM' END,
        'correlativo',sequence_number,'numeroCompleto',(CASE WHEN doc_type='BOLETA' THEN 'BDEM' ELSE 'FDEM' END)||'-'||lpad(sequence_number::text,8,'0'),
        'fecha',happened_at,'cliente',COALESCE((SELECT jsonb_build_object('nombre',nombre,'tipoDocumento',tipo_documento,'numeroDocumento',numero_documento) FROM cliente WHERE id=customer_id),jsonb_build_object('nombre','CLIENTES VARIOS')),
        'vendedor',(SELECT nombre FROM usuario WHERE id=operator_id),'subtotal',sale_net,'impuesto',sale_total-sale_net,'total',sale_total,
        'items',(SELECT jsonb_agg(jsonb_build_object('producto',descripcion,'cantidad',cantidad,'precioUnitario',precio_unitario,'total',total)) FROM detalle_venta WHERE venta_id=sale_id));
      INSERT INTO comprobante(venta_id,serie_comprobante_id,correlativo,estado,simulado,datos_documento,intentos,creado_en)
        VALUES(sale_id,series_id,sequence_number,'GENERADO',true,document,1,happened_at);
    END LOOP;
  END LOOP;
END $seed$;

-- Abort the entire load if inventory or financial records fail to reconcile.
DO $verify$
BEGIN
  IF EXISTS (SELECT 1 FROM lote l JOIN producto p ON p.id=l.producto_id WHERE p.codigo LIKE 'DEMO-NS-%'
    AND l.stock_actual<>(SELECT COALESCE(sum(m.cantidad),0) FROM movimiento m WHERE m.lote_id=l.id)) THEN
    RAISE EXCEPTION 'El stock no coincide con los movimientos';
  END IF;
  IF EXISTS (SELECT 1 FROM venta v WHERE v.solicitud_hash=repeat('d',64) AND
    (v.total<>(SELECT COALESCE(sum(d.total),0) FROM detalle_venta d WHERE d.venta_id=v.id)
     OR v.subtotal<>(SELECT COALESCE(sum(d.subtotal),0) FROM detalle_venta d WHERE d.venta_id=v.id)
     OR v.total<>(SELECT COALESCE(sum(p.monto),0) FROM pago p WHERE p.venta_id=v.id))) THEN
    RAISE EXCEPTION 'Los importes de ventas, detalles y pagos no coinciden';
  END IF;
  IF EXISTS (SELECT 1 FROM detalle_venta d JOIN venta v ON v.id=d.venta_id WHERE v.solicitud_hash=repeat('d',64)
    AND d.cantidad<>(SELECT COALESCE(sum(a.cantidad),0) FROM detalle_venta_lote a WHERE a.detalle_venta_id=d.id)) THEN
    RAISE EXCEPTION 'Las asignaciones por lote no coinciden con las ventas';
  END IF;
  IF EXISTS (SELECT 1 FROM compra c WHERE EXISTS (SELECT 1 FROM detalle_compra d JOIN producto p ON p.id=d.producto_id
      WHERE d.compra_id=c.id AND p.codigo LIKE 'DEMO-NS-%')
    AND c.total<>(SELECT sum(d.cantidad*d.costo_unitario) FROM detalle_compra d WHERE d.compra_id=c.id)) THEN
    RAISE EXCEPTION 'Los totales de compras no coinciden con sus detalles';
  END IF;
  IF EXISTS (SELECT 1 FROM detalle_compra d JOIN producto p ON p.id=d.producto_id WHERE p.codigo LIKE 'DEMO-NS-%'
    AND d.cantidad<>(SELECT COALESCE(sum(r.cantidad_recibida),0) FROM recepcion_lote r WHERE r.detalle_compra_id=d.id)) THEN
    RAISE EXCEPTION 'Las cantidades compradas y recibidas no coinciden';
  END IF;
  IF EXISTS (SELECT 1 FROM (
    SELECT m.saldo_posterior,sum(m.cantidad) OVER (PARTITION BY m.lote_id ORDER BY m.fecha,m.id) AS calculated
    FROM movimiento m JOIN lote l ON l.id=m.lote_id JOIN producto p ON p.id=l.producto_id
    WHERE p.codigo LIKE 'DEMO-NS-%') ledger WHERE saldo_posterior<>calculated OR calculated<0) THEN
    RAISE EXCEPTION 'Los saldos cronológicos no coinciden con el historial';
  END IF;
END $verify$;
COMMIT;

SELECT 'productos_demo' AS registro,count(*) AS cantidad FROM producto WHERE codigo LIKE 'DEMO-NS-%'
UNION ALL SELECT 'lotes_demo',count(*) FROM lote WHERE numero_lote LIKE 'DEMO-NS-%'
UNION ALL SELECT 'ventas_demo',count(*) FROM venta WHERE solicitud_hash=repeat('d',64)
UNION ALL SELECT 'comprobantes_demo',count(*) FROM comprobante WHERE datos_documento->>'demo'='DEMO-NS-V1';
