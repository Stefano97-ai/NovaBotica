# inventario

Responsabilidad: Lotes, existencias, movimientos y FEFO. Funcionalidad pendiente; todavía no expone endpoints.

Al implementar, organizar dentro de este módulo:
- controller: contrato HTTP de Spring MVC, validación y autorización.
- dto: entradas/salidas; no exponer entidades directamente.
- model: modelos y reglas del dominio.
- service: casos de uso, coordinación y límites @Transactional.
- repository: SQL parametrizado mediante Spring JDBC; sin SQL en controladores.

Colaborar entre servicios. Declarar permisos con @PreAuthorize; la autenticación global no sustituye la autorización. React es la Vista y permanece en frontend.
