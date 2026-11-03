# Inicio de sesión

El acceso utiliza cuentas PostgreSQL y sesiones opacas de 8 horas. La cookie es HttpOnly y SameSite=Strict; en producción también Secure. La base guarda solamente el hash del token. Las contraseñas se verifican con scrypt. Cerrar sesión revoca el token; iniciar sesión reemplaza el token anterior del mismo navegador.

## Uso local

1. Ejecutar `npm run db:start` y `npm run db:migrate`.
2. Ejecutar `npm run auth:admin` una sola vez. Las credenciales aleatorias quedan en `.local/login-admin.txt`, excluido de Git. Si admin ya existe, no se cambia su contraseña.
3. Ejecutar `npm run dev:api` y `npm run dev:web`. Abrir http://localhost:5173/login.

## API y permisos

- POST /api/auth/login: usuario y contraseña; devuelve datos del usuario y establece la cookie.
- GET /api/auth/me: consulta la sesión y el estado activo de la cuenta.
- POST /api/auth/logout: revoca la sesión y borra la cookie.
- El filtro global de Spring Security protege los endpoints salvo los declarados públicos (health y entrada/salida de sesión). El @PreAuthorize permite restringir operaciones del servidor.
- La navegación distingue administrador, vendedor y almacenero. Los módulos comerciales continúan como pantallas iniciales; sus futuras operaciones deben declarar permisos en el servidor.
- Límite compartido en PostgreSQL: 10 intentos por usuario y 30 por IP en 15 minutos, incluyendo accesos correctos.
- Las operaciones POST requieren X-Nova-Client: web y, si existe Origin, debe estar permitido por APP_ORIGINS. No se habilita CORS abierto.

En producción usar HTTPS, COOKIE_SECURE=true y APP_ORIGINS con los orígenes exactos separados por comas; servir frontend y /api bajo el mismo origen. Configurar la IP del cliente de forma segura si se introduce un proxy. No hay registro público ni recuperación automática de contraseña.

## Verificación

`npm run auth:test` comprueba credenciales, validación, cookies, protección de rutas, roles, rotación, cuenta inactiva, expiración, cierre y límite de intentos. `npm run db:test` verifica la conexión e integridad. `npm run build` compila ambos proyectos.

## Diseño aplicado en secuencia

1. Taste: dirección Accent ladder para aplicación administrativa, semilla 1658007034; DM Sans local, verdes de Nova Salud y formulario de dos columnas que se simplifica en móvil.
2. Impeccable: pulido de jerarquía, contraste, foco, mensajes, campos y tamaños táctiles. Se consultaron directamente las referencias polish y craft-floor porque el lanzador no pudo crear su caché.
3. Emil Kowalski: feedback ocasional de pulsación mediante transform, curva cubic-bezier(.23,1,.32,1), 100 ms al presionar y 160 ms al soltar. Indicador de espera con giro lineal de 700 ms. La preferencia de movimiento reducido elimina desplazamientos y el giro; mantiene el texto de estado. Las acciones de teclado no escalan el botón.

No se anima la entrada de la página ni los datos. Los estados de error conservan espacio y son anunciados por lectores de pantalla.

## Temas y fondo

El botón Modo claro / Modo oscuro está disponible en el acceso y en el menú del sistema. La preferencia se guarda localmente; sin elección previa se usa la preferencia del sistema operativo. Se aplica antes de renderizar para evitar un destello del tema incorrecto.

Fondo local: `frontend/public/images/pharmacy-background.png`. Creado con la herramienta integrada de generación de imágenes. Dirección del prompt: ilustración editorial panorámica 16:9 de una botica contemporánea, estantes verde salvia con cajas de medicamentos sin marca y frascos ámbar, mostrador, luz natural, tonos marfil y verde, composición central tranquila para el formulario; sin personas, texto, logotipos ni marcas de agua. El oscurecimiento es una capa CSS independiente, por lo que no se necesita descargar una segunda imagen.

Comprobados en navegador: cambio de tema, persistencia al recargar, escritorio 1366px y ausencia de desbordamiento a 390px y 320px. Compilación satisfactoria.

Implementación Java: backend/src/main/java/com/novasalud/auth. Las rutas y los formatos scrypt/sesión se conservan. La suite es JUnit/MockMvc con Testcontainers. Ver backend/README.md.
