CREATE TABLE rol (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo varchar(30) NOT NULL UNIQUE,
  nombre varchar(80) NOT NULL
);
CREATE TABLE usuario (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rol_id bigint NOT NULL REFERENCES rol(id),
  username varchar(80) NOT NULL UNIQUE,
  nombre varchar(160) NOT NULL,
  password_hash text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE categoria (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre varchar(100) NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true
);
CREATE TABLE producto (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  categoria_id bigint NOT NULL REFERENCES categoria(id),
  codigo varchar(60) NOT NULL UNIQUE,
  nombre varchar(180) NOT NULL,
  unidad_base varchar(30) NOT NULL DEFAULT 'UNIDAD',
  precio_venta numeric(14,2) NOT NULL CHECK (precio_venta >= 0),
  stock_minimo integer NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE lote (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id bigint NOT NULL REFERENCES producto(id),
  numero_lote varchar(80) NOT NULL,
  fecha_ingreso date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Lima')::date,
  fecha_vencimiento date NOT NULL,
  stock_actual integer NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  disponible boolean NOT NULL DEFAULT true,
  UNIQUE (producto_id, numero_lote),
  UNIQUE (id, producto_id)
);
CREATE TABLE proveedor (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ruc varchar(11) NOT NULL UNIQUE CHECK (ruc ~ '^[0-9]{11}$'),
  razon_social varchar(180) NOT NULL,
  telefono varchar(30), correo varchar(160), direccion text,
  activo boolean NOT NULL DEFAULT true
);
CREATE TABLE compra (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proveedor_id bigint NOT NULL REFERENCES proveedor(id),
  usuario_id bigint NOT NULL REFERENCES usuario(id),
  fecha timestamptz NOT NULL DEFAULT now(),
  total numeric(14,2) NOT NULL CHECK (total >= 0),
  estado varchar(20) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE','PARCIAL','RECIBIDA','ANULADA'))
);
CREATE TABLE detalle_compra (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  compra_id bigint NOT NULL REFERENCES compra(id),
  producto_id bigint NOT NULL REFERENCES producto(id),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  costo_unitario numeric(14,2) NOT NULL CHECK (costo_unitario >= 0),
  UNIQUE (id, producto_id)
);
CREATE TABLE recepcion_lote (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  detalle_compra_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  lote_id bigint NOT NULL,
  usuario_id bigint NOT NULL REFERENCES usuario(id),
  cantidad_recibida integer NOT NULL CHECK (cantidad_recibida > 0),
  fecha timestamptz NOT NULL DEFAULT now(),
  clave_idempotencia uuid NOT NULL UNIQUE,
  FOREIGN KEY (detalle_compra_id, producto_id) REFERENCES detalle_compra(id, producto_id),
  FOREIGN KEY (lote_id, producto_id) REFERENCES lote(id, producto_id)
);
CREATE TABLE cliente (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo_documento varchar(3) NOT NULL CHECK (tipo_documento IN ('DNI','RUC')),
  numero_documento varchar(11) NOT NULL,
  nombre varchar(180) NOT NULL,
  direccion text, correo varchar(160), telefono varchar(30),
  UNIQUE (tipo_documento, numero_documento),
  CHECK ((tipo_documento = 'DNI' AND numero_documento ~ '^[0-9]{8}$')
    OR (tipo_documento = 'RUC' AND numero_documento ~ '^[0-9]{11}$'))
);
CREATE TABLE venta (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id bigint REFERENCES cliente(id),
  usuario_id bigint NOT NULL REFERENCES usuario(id),
  fecha timestamptz NOT NULL DEFAULT now(),
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  impuesto numeric(14,2) NOT NULL CHECK (impuesto >= 0),
  total numeric(14,2) NOT NULL CHECK (total >= 0 AND total = subtotal + impuesto),
  estado varchar(20) NOT NULL DEFAULT 'CONFIRMADA' CHECK (estado IN ('CONFIRMADA','ANULADA')),
  clave_idempotencia uuid NOT NULL UNIQUE,
  solicitud_hash varchar(64) NOT NULL CHECK (solicitud_hash ~ '^[a-f0-9]{64}$'),
  anulada_por bigint REFERENCES usuario(id),
  anulada_en timestamptz,
  motivo_anulacion text,
  CHECK ((estado = 'CONFIRMADA' AND anulada_por IS NULL AND anulada_en IS NULL AND motivo_anulacion IS NULL)
    OR (estado = 'ANULADA' AND anulada_por IS NOT NULL AND anulada_en IS NOT NULL AND length(trim(motivo_anulacion)) > 0 AND motivo_anulacion IS NOT NULL))
);
CREATE TABLE detalle_venta (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  venta_id bigint NOT NULL REFERENCES venta(id),
  producto_id bigint NOT NULL REFERENCES producto(id),
  descripcion varchar(180) NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(14,2) NOT NULL CHECK (precio_unitario >= 0),
  tasa_impuesto numeric(7,4) NOT NULL CHECK (tasa_impuesto BETWEEN 0 AND 1),
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  impuesto numeric(14,2) NOT NULL CHECK (impuesto >= 0),
  total numeric(14,2) NOT NULL CHECK (total >= 0 AND total = subtotal + impuesto),
  UNIQUE (id, producto_id)
);
CREATE TABLE detalle_venta_lote (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  detalle_venta_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  lote_id bigint NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  UNIQUE (detalle_venta_id, lote_id),
  FOREIGN KEY (detalle_venta_id, producto_id) REFERENCES detalle_venta(id, producto_id),
  FOREIGN KEY (lote_id, producto_id) REFERENCES lote(id, producto_id)
);
CREATE TABLE pago (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  venta_id bigint NOT NULL REFERENCES venta(id),
  metodo varchar(30) NOT NULL CHECK (length(trim(metodo)) > 0),
  monto numeric(14,2) NOT NULL CHECK (monto > 0),
  referencia varchar(160),
  fecha timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE movimiento (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lote_id bigint NOT NULL REFERENCES lote(id),
  usuario_id bigint NOT NULL REFERENCES usuario(id),
  fecha timestamptz NOT NULL DEFAULT now(),
  tipo varchar(20) NOT NULL CHECK (tipo IN ('ENTRADA','SALIDA','AJUSTE')),
  cantidad integer NOT NULL CHECK (cantidad <> 0),
  motivo text NOT NULL CHECK (length(trim(motivo)) > 0),
  referencia text NOT NULL CHECK (length(trim(referencia)) > 0),
  venta_id bigint REFERENCES venta(id),
  recepcion_lote_id bigint REFERENCES recepcion_lote(id),
  CHECK ((tipo = 'ENTRADA' AND cantidad > 0) OR (tipo = 'SALIDA' AND cantidad < 0) OR tipo = 'AJUSTE'),
  CHECK (num_nonnulls(venta_id, recepcion_lote_id) <= 1)
);
CREATE TABLE tipo_comprobante (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo varchar(20) NOT NULL UNIQUE,
  nombre varchar(80) NOT NULL
);
CREATE TABLE serie_comprobante (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo_comprobante_id bigint NOT NULL REFERENCES tipo_comprobante(id),
  serie varchar(20) NOT NULL,
  ultimo_correlativo bigint NOT NULL DEFAULT 0 CHECK (ultimo_correlativo >= 0),
  activo boolean NOT NULL DEFAULT true,
  UNIQUE (tipo_comprobante_id, serie)
);
CREATE TABLE comprobante (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  venta_id bigint NOT NULL UNIQUE REFERENCES venta(id),
  serie_comprobante_id bigint NOT NULL REFERENCES serie_comprobante(id),
  correlativo bigint NOT NULL CHECK (correlativo > 0),
  estado varchar(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','GENERADO','ERROR','ANULADO')),
  simulado boolean NOT NULL DEFAULT true CHECK (simulado = true),
  datos_documento jsonb NOT NULL CHECK (jsonb_typeof(datos_documento) = 'object'),
  intentos integer NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  ultimo_error text, pdf_ruta text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (serie_comprobante_id, correlativo)
);

CREATE INDEX lote_fefo_idx ON lote(producto_id, fecha_vencimiento, id) WHERE disponible AND stock_actual > 0;
CREATE INDEX movimiento_lote_fecha_idx ON movimiento(lote_id, fecha);
CREATE INDEX venta_fecha_idx ON venta(fecha);
CREATE INDEX compra_proveedor_idx ON compra(proveedor_id);
CREATE INDEX detalle_compra_compra_idx ON detalle_compra(compra_id);
CREATE INDEX recepcion_detalle_idx ON recepcion_lote(detalle_compra_id);
CREATE INDEX detalle_venta_venta_idx ON detalle_venta(venta_id);
CREATE INDEX pago_venta_idx ON pago(venta_id);

CREATE VIEW stock_disponible AS
SELECT p.id AS producto_id, COALESCE(sum(l.stock_actual), 0)::bigint AS cantidad
FROM producto p LEFT JOIN lote l ON l.producto_id = p.id
  AND l.disponible AND l.fecha_vencimiento >= (now() AT TIME ZONE 'America/Lima')::date
WHERE p.activo GROUP BY p.id;

INSERT INTO rol(codigo, nombre) VALUES ('ADMINISTRADOR','Administrador'), ('VENDEDOR','Vendedor'), ('ALMACENERO','Almacenero');
INSERT INTO tipo_comprobante(codigo, nombre) VALUES ('BOLETA','Boleta simulada'), ('FACTURA','Factura simulada'), ('NOTA_VENTA','Nota de venta simulada');
INSERT INTO serie_comprobante(tipo_comprobante_id, serie)
SELECT id, CASE codigo WHEN 'BOLETA' THEN 'B001' WHEN 'FACTURA' THEN 'F001' ELSE 'NV001' END FROM tipo_comprobante;
