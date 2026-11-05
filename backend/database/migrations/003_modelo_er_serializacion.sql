-- Additive alignment with the supplied ER model. Preserve IDs, API names and history.
ALTER TABLE producto ADD COLUMN presentacion varchar(30)
  GENERATED ALWAYS AS (unidad_base) STORED;
ALTER TABLE detalle_compra ADD COLUMN subtotal numeric(24,2)
  GENERATED ALWAYS AS (cantidad::numeric * costo_unitario) STORED;
ALTER TABLE venta ADD COLUMN igv numeric(14,2)
  GENERATED ALWAYS AS (impuesto) STORED;

ALTER TABLE tipo_comprobante ADD COLUMN codigo_sunat varchar(2);
UPDATE tipo_comprobante SET codigo_sunat = CASE codigo
  WHEN 'FACTURA' THEN '01' WHEN 'BOLETA' THEN '03' ELSE NULL END;
ALTER TABLE tipo_comprobante ADD CONSTRAINT tipo_codigo_sunat_formato
  CHECK (codigo_sunat IS NULL OR codigo_sunat ~ '^[0-9]{2}$');
CREATE UNIQUE INDEX tipo_comprobante_sunat_uk ON tipo_comprobante(codigo_sunat)
  WHERE codigo_sunat IS NOT NULL;
ALTER TABLE comprobante ADD COLUMN fecha_emision timestamptz
  GENERATED ALWAYS AS (creado_en) STORED;
ALTER TABLE comprobante ADD COLUMN modo_emision varchar(12)
  GENERATED ALWAYS AS (CASE WHEN simulado THEN 'SIMULADO' ELSE 'ELECTRONICO' END) STORED;

ALTER TABLE movimiento ADD COLUMN tipo_movimiento varchar(20)
  GENERATED ALWAYS AS (tipo) STORED;
ALTER TABLE movimiento ADD COLUMN origen_tipo varchar(20)
  GENERATED ALWAYS AS (CASE WHEN venta_id IS NOT NULL THEN 'VENTA'
    WHEN recepcion_lote_id IS NOT NULL THEN 'RECEPCION_LOTE' ELSE 'MANUAL' END) STORED;
ALTER TABLE movimiento ADD COLUMN origen_id bigint
  GENERATED ALWAYS AS (COALESCE(venta_id, recepcion_lote_id)) STORED;
ALTER TABLE movimiento ADD COLUMN saldo_anterior integer;
ALTER TABLE movimiento ADD COLUMN saldo_posterior integer;
-- Reconstruct only complete, nonnegative ledgers starting at zero. Never invent balances
-- for legacy lots whose current stock cannot be reconciled with recorded movements.
WITH ledger AS (
  SELECT m.id, m.lote_id, m.cantidad,
    sum(m.cantidad::bigint) OVER (PARTITION BY m.lote_id ORDER BY m.fecha,m.id) AS saldo,
    sum(m.cantidad::bigint) OVER (PARTITION BY m.lote_id) AS total
  FROM movimiento m
), reconciled AS (
  SELECT x.lote_id FROM ledger x JOIN lote l ON l.id=x.lote_id
  GROUP BY x.lote_id,l.stock_actual
  HAVING min(x.saldo)>=0 AND max(x.total)=l.stock_actual
)
UPDATE movimiento m SET saldo_anterior=(x.saldo-x.cantidad)::integer,
  saldo_posterior=x.saldo::integer
FROM ledger x JOIN reconciled r ON r.lote_id=x.lote_id WHERE m.id=x.id;
ALTER TABLE movimiento ADD CONSTRAINT movimiento_saldos_coherentes CHECK (
  (saldo_anterior IS NULL AND saldo_posterior IS NULL) OR
  (saldo_anterior IS NOT NULL AND saldo_posterior IS NOT NULL AND
   saldo_anterior>=0 AND saldo_posterior>=0 AND
   saldo_posterior::bigint=saldo_anterior::bigint+cantidad));
CREATE INDEX movimiento_origen_idx ON movimiento(origen_tipo,origen_id);

ALTER TABLE detalle_venta_lote ADD CONSTRAINT asignacion_lote_producto_uk
  UNIQUE(id,lote_id,producto_id);
CREATE TABLE unidad_serializada (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lote_id bigint NOT NULL,
  detalle_compra_id bigint NOT NULL,
  asignacion_id bigint,
  -- Internal key makes cross-product links impossible, even when a parent is updated.
  producto_id bigint NOT NULL,
  numero_serie varchar(160) NOT NULL UNIQUE
    CHECK(length(btrim(numero_serie))>0 AND numero_serie=btrim(numero_serie)),
  codigo_escaneado text CHECK(codigo_escaneado IS NULL OR length(btrim(codigo_escaneado))>0),
  estado varchar(20) NOT NULL DEFAULT 'DISPONIBLE'
    CHECK(estado IN ('DISPONIBLE','VENDIDA','BAJA')),
  fecha_registro timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unidad_estado_asignacion CHECK((estado='VENDIDA')=(asignacion_id IS NOT NULL)),
  FOREIGN KEY(lote_id,producto_id) REFERENCES lote(id,producto_id),
  FOREIGN KEY(detalle_compra_id,producto_id) REFERENCES detalle_compra(id,producto_id),
  FOREIGN KEY(asignacion_id,lote_id,producto_id)
    REFERENCES detalle_venta_lote(id,lote_id,producto_id)
);
CREATE INDEX unidad_lote_idx ON unidad_serializada(lote_id);
CREATE INDEX unidad_compra_idx ON unidad_serializada(detalle_compra_id);
CREATE INDEX unidad_asignacion_idx ON unidad_serializada(asignacion_id) WHERE asignacion_id IS NOT NULL;

CREATE FUNCTION validar_unidad_serializada() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE limite integer;
BEGIN
  IF TG_OP='UPDATE' AND (NEW.lote_id<>OLD.lote_id OR NEW.detalle_compra_id<>OLD.detalle_compra_id) THEN
    RAISE EXCEPTION 'El origen de una unidad serializada es inmutable' USING ERRCODE='23514';
  END IF;
  SELECT producto_id INTO NEW.producto_id FROM lote WHERE id=NEW.lote_id;
  -- Lock parent rows before counting, so concurrent registrations cannot exceed capacity.
  SELECT cantidad INTO limite FROM detalle_compra WHERE id=NEW.detalle_compra_id FOR UPDATE;
  IF (SELECT count(*) FROM unidad_serializada WHERE detalle_compra_id=NEW.detalle_compra_id
      AND id IS DISTINCT FROM NEW.id)>=limite THEN
    RAISE EXCEPTION 'La serializacion supera la cantidad comprada' USING ERRCODE='23514';
  END IF;
  IF NEW.asignacion_id IS NOT NULL THEN
    SELECT cantidad INTO limite FROM detalle_venta_lote WHERE id=NEW.asignacion_id FOR UPDATE;
    IF (SELECT count(*) FROM unidad_serializada WHERE asignacion_id=NEW.asignacion_id
        AND id IS DISTINCT FROM NEW.id)>=limite THEN
      RAISE EXCEPTION 'La serializacion supera la cantidad asignada' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER unidad_serializada_validar BEFORE INSERT OR UPDATE ON unidad_serializada
  FOR EACH ROW EXECUTE FUNCTION validar_unidad_serializada();

CREATE FUNCTION proteger_capacidad_serializada() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE usadas bigint;
BEGIN
  IF TG_TABLE_NAME='detalle_compra' THEN
    SELECT count(*) INTO usadas FROM unidad_serializada WHERE detalle_compra_id=NEW.id;
  ELSE
    SELECT count(*) INTO usadas FROM unidad_serializada WHERE asignacion_id=NEW.id;
  END IF;
  IF NEW.cantidad<usadas THEN
    RAISE EXCEPTION 'La cantidad es menor que las unidades serializadas vinculadas' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER compra_capacidad_serializada BEFORE UPDATE OF cantidad ON detalle_compra
  FOR EACH ROW EXECUTE FUNCTION proteger_capacidad_serializada();
CREATE TRIGGER venta_capacidad_serializada BEFORE UPDATE OF cantidad ON detalle_venta_lote
  FOR EACH ROW EXECUTE FUNCTION proteger_capacidad_serializada();

COMMENT ON TABLE unidad_serializada IS 'Serializacion opcional: no genera stock ni modifica FEFO por si sola.';
COMMENT ON COLUMN movimiento.saldo_anterior IS 'NULL en historicos sin un libro completo reconciliable; nuevos movimientos JPA capturan ambos saldos.';
COMMENT ON COLUMN producto.presentacion IS 'Alias calculado de unidad_base; se conserva el contrato actual de catalogo.';
COMMENT ON COLUMN comprobante.fecha_emision IS 'Fecha de creacion de la solicitud de emision simulada; no acredita emision fiscal.';
