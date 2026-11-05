ALTER TABLE producto ADD COLUMN requiere_serie boolean NOT NULL DEFAULT false;
UPDATE producto p SET requiere_serie=true WHERE EXISTS (SELECT 1 FROM unidad_serializada u WHERE u.producto_id=p.id);
CREATE INDEX unidad_disponible_producto_idx ON unidad_serializada(producto_id,lote_id,id) WHERE estado='DISPONIBLE';

-- Add CE without rewriting historical customer identities.
DO $$ DECLARE c record; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='cliente'::regclass AND contype='c'
    AND pg_get_constraintdef(oid) LIKE '%tipo_documento%' LOOP
    EXECUTE format('ALTER TABLE cliente DROP CONSTRAINT %I',c.conname);
  END LOOP;
END $$;
ALTER TABLE cliente ADD CONSTRAINT cliente_tipo_documento_check CHECK(tipo_documento IN ('DNI','RUC','CE'));
ALTER TABLE cliente ADD CONSTRAINT cliente_documento_formato_check CHECK(
  (tipo_documento='DNI' AND numero_documento ~ '^[0-9]{8}$') OR
  (tipo_documento='RUC' AND numero_documento ~ '^[0-9]{11}$') OR
  (tipo_documento='CE' AND numero_documento ~ '^[A-Za-z0-9]{6,11}$'));
