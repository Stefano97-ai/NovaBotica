CREATE TABLE alerta (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo varchar(30) NOT NULL CHECK(tipo IN ('STOCK_BAJO','AGOTADO','POR_VENCER','VENCIMIENTO_URGENTE','VENCIDO')),
  prioridad varchar(10) NOT NULL CHECK(prioridad IN ('MEDIA','ALTA','CRITICA')),
  estado varchar(10) NOT NULL DEFAULT 'ACTIVA' CHECK(estado IN ('ACTIVA','RESUELTA')),
  producto_id bigint REFERENCES producto(id),
  lote_id bigint REFERENCES lote(id),
  datos jsonb NOT NULL CHECK(jsonb_typeof(datos)='object'),
  version integer NOT NULL DEFAULT 1 CHECK(version>=1),
  creada_en timestamptz NOT NULL DEFAULT now(),
  actualizada_en timestamptz NOT NULL DEFAULT now(),
  resuelta_en timestamptz,
  CHECK ((producto_id IS NOT NULL AND lote_id IS NULL AND tipo IN ('STOCK_BAJO','AGOTADO')) OR
         (lote_id IS NOT NULL AND producto_id IS NULL AND tipo IN ('POR_VENCER','VENCIMIENTO_URGENTE','VENCIDO'))),
  CHECK ((estado='RESUELTA')=(resuelta_en IS NOT NULL))
);
CREATE UNIQUE INDEX alerta_producto_activa_uk ON alerta(producto_id) WHERE estado='ACTIVA' AND producto_id IS NOT NULL;
CREATE UNIQUE INDEX alerta_lote_activa_uk ON alerta(lote_id) WHERE estado='ACTIVA' AND lote_id IS NOT NULL;
CREATE INDEX alerta_estado_fecha_idx ON alerta(estado,creada_en DESC,id DESC);

CREATE TABLE alerta_usuario (
  alerta_id bigint NOT NULL REFERENCES alerta(id) ON DELETE CASCADE,
  usuario_id bigint NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  version_leida integer NOT NULL CHECK(version_leida>=1),
  leida_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(alerta_id,usuario_id)
);
CREATE INDEX alerta_usuario_usuario_idx ON alerta_usuario(usuario_id,alerta_id);

CREATE TABLE alerta_rol (
  alerta_id bigint NOT NULL REFERENCES alerta(id) ON DELETE CASCADE,
  rol_id bigint NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
  PRIMARY KEY(alerta_id,rol_id)
);
CREATE INDEX alerta_rol_rol_idx ON alerta_rol(rol_id,alerta_id);
