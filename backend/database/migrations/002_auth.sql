-- Username policy: case-insensitive, trimmed, unique. Abort on ambiguous existing data.
CREATE UNIQUE INDEX usuario_username_normalizado ON usuario (lower(btrim(username)));
CREATE TABLE sesion (
  token_hash char(64) PRIMARY KEY,
  usuario_id bigint NOT NULL REFERENCES usuario(id),
  creada_en timestamptz NOT NULL DEFAULT now(),
  expira_en timestamptz NOT NULL,
  CHECK (expira_en > creada_en)
);
CREATE INDEX sesion_usuario_idx ON sesion(usuario_id);
CREATE INDEX sesion_expira_idx ON sesion(expira_en);
CREATE TABLE acceso_limite (
  clave char(64) PRIMARY KEY,
  intentos integer NOT NULL CHECK (intentos > 0),
  expira_en timestamptz NOT NULL
);
CREATE INDEX acceso_limite_expira_idx ON acceso_limite(expira_en);
