ALTER TABLE producto ADD COLUMN imagen_version uuid;
CREATE TABLE producto_imagen (
  producto_id bigint PRIMARY KEY REFERENCES producto(id) ON DELETE CASCADE,
  contenido bytea NOT NULL CHECK (octet_length(contenido) BETWEEN 1 AND 8388608)
);
