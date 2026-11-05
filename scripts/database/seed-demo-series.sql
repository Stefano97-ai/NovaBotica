-- Optional sample identifiers for the existing DEMO thermometer only. No stock changes.
\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('nova-salud-demo-series-v1'));
DO $$
DECLARE p bigint; l bigint; d bigint; n int;
BEGIN
  SELECT id INTO p FROM producto WHERE codigo='DEMO-NS-023' FOR UPDATE;
  IF p IS NULL THEN RAISE NOTICE 'No existe el termómetro DEMO; no se crean datos.'; RETURN; END IF;
  SELECT lot.id,r.detalle_compra_id INTO l,d FROM lote lot JOIN recepcion_lote r ON r.lote_id=lot.id
    WHERE lot.producto_id=p AND lot.numero_lote LIKE 'DEMO-NS-%' AND lot.disponible AND lot.stock_actual>=3
      AND lot.fecha_vencimiento>=(now() AT TIME ZONE 'America/Lima')::date
    ORDER BY lot.fecha_vencimiento,lot.id,r.id LIMIT 1 FOR UPDATE OF lot;
  IF l IS NULL THEN RAISE NOTICE 'No hay lote DEMO con capacidad; no se crean series.'; RETURN; END IF;
  FOR n IN 1..3 LOOP
    IF NOT EXISTS(SELECT 1 FROM unidad_serializada WHERE numero_serie='DEMO-TERM-'||lpad(n::text,3,'0')) THEN
      IF (SELECT count(*) FROM unidad_serializada WHERE lote_id=l AND estado='DISPONIBLE') >=
         (SELECT stock_actual FROM lote WHERE id=l) THEN RAISE EXCEPTION 'No hay capacidad disponible'; END IF;
      INSERT INTO unidad_serializada(lote_id,detalle_compra_id,producto_id,numero_serie)
        VALUES(l,d,p,'DEMO-TERM-'||lpad(n::text,3,'0'));
    END IF;
  END LOOP;
  UPDATE producto SET requiere_serie=true WHERE id=p;
END $$;
COMMIT;
