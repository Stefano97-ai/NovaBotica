# PostgreSQL

DatabaseModule exporta DatabaseService. Los módulos que necesiten persistencia deben importar DatabaseModule.

query(sql, parametros) ejecuta consultas parametrizadas. transaction(async client => ...) confirma o revierte automáticamente. Dentro del callback usar exclusivamente client.query y pasar ese mismo cliente a todos los repositorios participantes, sin llamar a database.query.

NUMERIC y BIGINT se devuelven como cadenas para preservar precisión. No convertir dinero a Number sin una estrategia decimal. /api/health/db comprueba conexión y migración; /api/health solo mide el proceso. Aplicar migraciones explícitamente antes del arranque. Ver docs/base-de-datos.md.
