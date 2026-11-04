# Noma — Desarrollo local

Noma (nombre provisional): plataforma de reservas, recepción y operación de negocios de servicios. Appointments conserva el núcleo operativo actual.
M1.6 añade la configuración operativa de Equipo (Staff/EQU), sobre el catálogo
M1.5, el acceso local M1.4 y el entorno reproducible M1.1–M1.3.

## M1.6.6: preparación guiada de negocios Beauty

Ruta privada: `http://localhost:5173/onboarding`. Se ofrece desde `/activacion`
cuando hay una identidad verificada y una habilitación vigente. El acceso con
código local no crea negocios mediante este recorrido ni sustituye la sesión comercial.

Para probar con cuentas de desarrollo: registrar/verificar una cuenta cliente,
elegir una propuesta y solicitar activación. Otro operador autorizado de Noma Control
debe aprobar la solicitud y autorizar un piloto con vencimiento explícito. Elegir
«Sin negocio asociado · preparar un nuevo negocio» para una cuenta sin establecimiento,
o asociar explícitamente su membresía existente. No se permite aprobar la propia
solicitud ni se registra un pago. No usar cuentas reales como fixtures automatizadas.

El cliente entra en `/activacion`, elige «Preparar mi espacio de trabajo» y recorre:
sector → negocio → sucursal/horarios → servicios → equipo/recursos → revisión.
Solo belleza y bienestar permite avanzar; odontología, fitness y automotriz muestran
su estado de desarrollo. No se cambia el sector de un negocio existente.

El alta nueva exige nombre, país, ciudad, teléfono, correo comercial y zona horaria.
Dirección física, descripción y subtipo Beauty son opcionales. Para finalizar hacen
falta una sucursal activa con horario de atención, un servicio activo y un profesional
activo asociado a una sucursal y un servicio. Los recursos y horarios individuales
son opcionales. Un profesional no es una cuenta de acceso. Los horarios sugeridos
solo se guardan al confirmarlos; se reutilizan las validaciones de intervalos de Staff.

El guardado es explícito y PostgreSQL conserva la etapa y las entidades reales.
Cerrar sesión o cambiar de dispositivo no pierde lo ya guardado. Los campos aún no
guardados requieren confirmación antes de descartarse. Reintentos usan `requestId`
estable y una versión; cambiar los datos de un intento o editar una versión antigua
devuelve conflicto. Negocio, membresía, consumo del piloto y auditoría se crean de
forma transaccional, sin duplicados ante doble clic o concurrencia.

Los límites se resuelven desde el plan autorizado: sucursales/profesionales registrados
y membresías activas del panel. Staff conserva esos límites después del onboarding.
Enterprise requiere condiciones explícitas y no obtiene un límite ilimitado por defecto.
No hay medición de IA ni cuotas de consumo simuladas. Vencer o suspender el piloto
bloquea escrituras y conserva los datos. La autorización se comprueba en backend.

Los negocios históricos no se duplican ni se marcan completos automáticamente: al
seleccionarlos se evalúa la configuración real y se propone la primera etapa pendiente.
Los campos aditivos ausentes no obligan a rehacer toda la configuración histórica.
Al terminar se utiliza la selección de membresía y la sesión comercial existentes;
los datos se editan después desde Negocio, Servicios y Equipo. Control solo consulta
el inicio/progreso/finalización y su auditoría, sin editar esa configuración.

La migración aditiva `20261031000100_beauty_onboarding` añade seis campos opcionales
a Establishment y crea BusinessOnboarding y OnboardingOperation. No modifica las ocho
migraciones históricas. No hay onboarding genérico de workflows ni un duplicado JSON
de los servicios y del equipo. El proveedor de identidad, login, recuperación,
sesiones y bootstrap permanecen sin cambios; la integración en Activación es compatible.

`pnpm verify` incluye las pruebas API, frontend y PostgreSQL aislado del recorrido.
No se habilitan reservas, IA, cobros ni contratación de producción. El adaptador también
reconoce el contrato existente de suscripción con evidencia externa para preparar
un negocio ya provisionado; el proveedor de pagos y el alta pagada sin negocio
todavía requieren su contrato de provisión futuro. No se inventa una suscripción pagada.

## M1.6.3: identidad comercial y activación

El adaptador implementado utiliza **Auth0 Universal Login por OIDC**, mediante
`openid-client@6.8.8`. Es la elección técnica de este milestone, no una cuenta,
contrato, presupuesto ni región ya aprobados. Auth0 era candidato en TD-007.
Frente a Keycloak evita operar otro servicio de identidad; frente a adoptar una
plataforma de datos adicional conserva PostgreSQL/Prisma y las membresías propias.
La previsibilidad del costo requiere presupuestar usuarios activos, M2M, correo,
MFA y condiciones B2B en la [tarifa vigente](https://auth0.com/pricing). No asumir
que las cuotas gratis, organizaciones o MFA cubren el lanzamiento comercial.

El acceso comercial **queda deshabilitado por defecto** hasta configurar un tenant
real y comprobarlo. No se inventaron credenciales ni se envían correos de prueba a
personas. Las pantallas explican la configuración pendiente y no simulan éxito.

| Ruta                    | Función                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `/registro`             | Correo y salida al registro gestionado                               |
| `/login`                | Login comercial gestionado                                           |
| `/verificar-correo`     | Identidad pendiente, reenvío y nueva comprobación                    |
| `/recuperar-acceso`     | Recuperación en el login alojado del proveedor                       |
| `/activacion`           | Preferencia de plan, solicitud pendiente y selección de membresía    |
| `/acceso-no-autorizado` | Explicación y recuperación de acceso                                 |
| `/dev/login`            | Código local existente; solo si el backend habilita desarrollo local |

Los enlaces a `/login` ahora abren identidad comercial. Para probar los negocios
locales existentes, conservar `pnpm dev:access` y utilizar `/dev/login`. La landing,
demo, mascota, Offering y Staff mantienen sus recorridos y reglas.

### Configurar Auth0 manualmente

1. Crear un tenant de desarrollo y una aplicación **Regular Web Application**,
   con Universal Login, conexión de correo habilitada, Authorization Code y
   autenticación del cliente por POST. Utilizar RS256. Configurar y comprobar
   verificación de correo, recuperación y protección contra abuso del proveedor.
2. En desarrollo, permitir exactamente el callback
   `http://localhost:5173/api/auth/callback`, logout
   `http://localhost:5173/login` y origen `http://localhost:5173`.
   Establecer la ruta de login por defecto en `/login` de ese origen. No usar
   comodines. Frontend y API se sirven bajo el mismo origen mediante `/api`.
3. Completar **solo** `apps/api/.env`, usando `.env.example` como referencia:
   `OIDC_ISSUER=https://TU-TENANT.auth0.com/` (el dominio real de tu tenant),
   `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI` y
   `COMMERCIAL_STATE_KEY` (32 bytes aleatorios, codificados en 64 caracteres hex).
   No colocar estas claves en variables `VITE_`, README, capturas o chats.
   Para generar la clave en PowerShell sin imprimirla:

   ```powershell
   $nomaRandom = [Security.Cryptography.RandomNumberGenerator]::Create()
   $nomaBytes = New-Object byte[] 32
   $nomaRandom.GetBytes($nomaBytes)
   $nomaStateKey = ([BitConverter]::ToString($nomaBytes)).Replace('-', '').ToLowerInvariant()
   $nomaRandom.Dispose()
   # Guardar $nomaStateKey como COMMERCIAL_STATE_KEY en el .env local; no mostrarlo en logs.
   ```

4. Para reenviar verificaciones, crear una aplicación M2M separada autorizada para
   la Management API con `update:users`, sin permisos adicionales. Guardar sus
   datos en `AUTH0_MANAGEMENT_CLIENT_ID` y `AUTH0_MANAGEMENT_CLIENT_SECRET`.
   En esta primera integración usar el dominio canónico del tenant como issuer;
   dominios personalizados y su audiencia de Management API requieren validación.
5. Habilitar `COMMERCIAL_AUTH_ENABLED=true` únicamente con toda la configuración.
   Reiniciar la API de forma coordinada. Un flag habilitado con configuración
   incompleta o insegura impide arrancar; no degrada a login local.
6. Probar registro real, correo recibido, verificación, reenvío, cuenta existente,
   recuperación, MFA si se habilita, logout del proveedor y errores con datos de
   prueba autorizados. Solo estas pruebas pueden cerrar la validación externa.
   Para producción usar tenant/secretos separados, HTTPS y callbacks exactos del
   dominio definitivo; configurar correo real, políticas de sesión y MFA en Auth0.

[Universal Login](https://auth0.com/docs/authenticate/login/auth0-universal-login),
[verificación](https://auth0.com/docs/manage-users/user-accounts/verify-emails),
[reenvío](https://auth0.com/docs/manage-users/user-accounts/resend-verification-emails)
y [recuperación](https://auth0.com/docs/authenticate/database-connections/password-change).
Noma nunca guarda contraseñas. Recuperación abre el proveedor y allí se elige
«¿Olvidaste tu contraseña?». No se anuncia un correo enviado desde una simulación.
El reenvío acepta solo la identidad de la sesión, nunca un correo o userId libre.

### Persistencia y autorización

La migración aditiva `20261030000100_commercial_identity` crea ExternalIdentity,
CommercialSession, OidcAttempt, IdentityRateLimit, CommercialApplication y
CommercialSubscription, sus enums, claves y restricciones. No reemplaza filas,
no infiere correos de usuarios locales ni modifica migraciones anteriores.

`(issuer, subject)` identifica a la persona externa. No se unen cuentas por correo;
un correo igual con otro subject no hereda permisos. Alta y asociación se realizan
en una transacción con unicidad y reintento acotado ante concurrencia, sin cuentas
huérfanas. El registro no crea establecimientos ni membresías. Cada usuario puede
tener varias membresías; solo se elige explícitamente una vigente. El servidor
revalida pertenencia, rol OWNER actual, estado del establecimiento y suscripción
en cada solicitud. Cambiar tenant rota la sesión; referencias de otro tenant
siguen rechazadas por las reglas existentes. No se introducen nuevos roles.

Una cuenta tiene una solicitud inicial: REGISTRATION_STARTED, IDENTITY_VERIFIED,
PLAN_SELECTED o ACTIVATION_PENDING. La selección de plan y el envío de la solicitud
son operaciones diferentes. La suscripción pertenece al establecimiento y tiene
estado ACTIVATION_PENDING, ACTIVE, SUSPENDED o CANCELLED. Una evidencia externa
requiere referencia no vacía; activar requiere fecha. **No existe endpoint para
activar/suspender/cancelar**, ni se confía en `paid=true`. La vía futura que valide
evidencia externa aún no está implementada. No hay checkout, cobros ni onboarding.

El contrato público tipado `apps/api/src/commercial/plan.contract.ts` centraliza
START/GROW/SCALE/ENTERPRISE, importes propuestos, límites de presentación y estado
UNPUBLISHED_PROPOSAL. React importa ese contrato puro, sin cargar implementación
NestJS. Suscripción, sesiones IA, Meta y pasarela siguen siendo conceptos separados.
No se aplican todavía límites comerciales a Offering o Staff.

### Sesiones y controles

OIDC utiliza Authorization Code + PKCE S256, state y nonce. `openid-client` valida
issuer, audience, expiración y RS256, con `enableNonRepudiationChecks` explícito
para verificar la firma. La transacción dura diez minutos, se liga a una cookie
aleatoria del navegador y se consume atómicamente. PKCE/nonce/retorno están cifrados
con AES-256-GCM en DB. Ni ID tokens, access tokens ni refresh tokens se persisten o
devuelven a React. El retorno solo permite las tres rutas privadas conocidas.

La sesión Noma usa 256 bits aleatorios; DB conserva SHA-256. Cookie HttpOnly,
SameSite=Lax, host-only y Secure en producción (prefijo `__Host-`, Path `/`).
Caduca al menor plazo entre expiración del ID token y ocho horas, y tras treinta
minutos sin actividad; no hay refresh silencioso ni localStorage de credenciales.
Las mutaciones exigen Origin exacto; los endpoints de identidad también JSON.
State y cookie cubren el callback de otro sitio. Se usa `no-store` y, en identidad,
`Referrer-Policy: no-referrer`. No registrar queries del callback en el proxy futuro.

Login y callback tienen límites por origen de red persistidos en PostgreSQL;
reenvío, tres solicitudes por identidad cada quince minutos. No se confía en
X-Forwarded-For. En un proxy futuro se deben validar límites en el borde y política
de proxy confiable, para no compartir por accidente el límite de toda la red.
Logout revoca la sesión local antes de intentar el logout OIDC. Si el proveedor
falla, se informa que su sesión puede seguir abierta. Un login comercial elimina
la cookie local anterior; un intercambio de código local revoca la sesión comercial
del navegador. No se reutilizan tablas o tokens entre mecanismos.

### Fixtures y verificación local

Solo para datos sintéticos nuevos, con base/usuario de desarrollo comprobados:

```powershell
pnpm dev:commercial --fixture --plan START
# Copiar los UUID impresos; no se genera una sesión ni una contraseña.
pnpm dev:commercial --application UUID_SOLICITUD --membership UUID_MEMBRESIA
```

La activación rechaza producción/staging/test y cualquier usuario o negocio que no
sea una fixture explícita (`synthetic.noma.invalid`, marca synthetic y nombre
«Sintético Noma»). No adopta ni activa el negocio existente de Jorge. Evidencia
LOCAL_SYNTHETIC no habilita módulos comerciales fuera de desarrollo local. No hay
login OIDC ficticio para esas cuentas. El acceso con código sigue siendo el
mecanismo de pruebas locales, separado del proveedor comercial.

```powershell
pnpm verify
# test:oidc requiere el build API; verify lo ejecuta al final automáticamente.
pnpm test:oidc
pnpm health
pnpm db:migrate:status
```

La prueba OIDC usa el cliente real, firmas RSA y un transporte sintético en memoria.
Las pruebas HTTP usan PostgreSQL de tests y un adapter de proveedor explícitamente
simulado. Ninguna equivale a un registro o correo realmente procesado por Auth0.
La ejecución contra Auth0 queda pendiente de credenciales y configuración externa.

Validación local ejecutada en M1.6.3: `pnpm verify` correcto, con 385 pruebas
(7 scripts, 179 API, 111 frontend, 79 integración PostgreSQL y 9 del protocolo OIDC),
lint, formato, typecheck y builds. Se aplicaron seis migraciones en total. Además,
una fixture nueva se creó y activó en la base local real, repitiendo la activación
sin duplicarla; se retiró únicamente esa fixture tras comprobar su propiedad.
Los conteos y digests de todos los datos comerciales previos coincidieron después.

Antes de producción faltan validación externa completa, costos/contrato/región y
preguntas P0; dominio/proxy definitivos, MFA y correo reales; política de retención
y purga de sesiones/intentos/rate limits; revocación local por eventos de bloqueo o
reset del proveedor (mientras tanto las sesiones Noma tienen sus propios plazos);
pruebas de carga y revisión de datos personales. El lanzamiento general sigue
condicionado a las cuatro verticales. No se afirma preparación para producción.

## M1.6.2: experiencia pública y aplicación privada

La landing conserva el hero y Nomi. El recorrido inferior ahora es un explorador
por capítulos: `/#recorrido`, `/#sectores`, `/#planes`, `/#estado` y `/#preguntas`.
Solo monta un capítulo a la vez; admite enlaces directos y Atrás/Adelante. En móvil,
el selector de planes muestra una sola tarjeta para reducir la lectura vertical.
Los logotipos de ritmo, CIMA, marea y EJE son muestras ficticias, identificadas como
tales, sin implicar clientes o alianzas reales. Sustituirlos por marcas autorizadas
en `LandingBody.tsx` cuando existan.

`Pricing.tsx` presenta la propuesta recibida: Start $29/mes o $290/año, Grow $59/mes
o $590/año, Scale $99/mes o $990/año, antes de IVA. No activa compras ni pruebas.
Conserva límites mensuales de IA en anual, separa costos externos y explica sesiones
de 24 horas, consumo y condiciones pendientes de validación comercial y legal. No
se publican como garantizadas las tarifas de Meta ni de pasarelas del borrador.

El espacio audiovisual ofrece un adelanto ilustrativo manual. Para sustituirlo por
la grabación real, configurar `VITE_PUBLIC_VIDEO_URL` en `apps/web/.env` con una URL
HTTPS directa MP4/WebM, sin credenciales. Es pública: no incluir secretos. Solo
monta el reproductor al pulsar Ver video, sin autoplay ni descarga inicial; incluye
controles nativos y recuperación de errores. La grabación final debe proporcionar
subtítulos y transcripción accesibles antes de su publicación. No usa YouTube ni
dependencias audiovisuales. Pie compacto: «Hecho en Ecuador por VérticeEC».

```powershell
pnpm dev:local
```

| URL local                                 | Experiencia                                                     |
| ----------------------------------------- | --------------------------------------------------------------- |
| http://localhost:5173/                    | Landing pública de Noma, sin sesión ni llamadas a APIs privadas |
| http://localhost:5173/demo                | Simulación conceptual interactiva con cuatro verticales         |
| http://localhost:5173/login               | Identidad comercial gestionada                                  |
| http://localhost:5173/dev/login           | Acceso local existente con código de desarrollo                 |
| http://localhost:5173/app/establecimiento | Configuración privada y sector                                  |
| http://localhost:5173/app/servicios       | Catálogo privado                                                |
| http://localhost:5173/app/equipo          | Profesionales, sucursales, horarios y recursos                  |

Los marcadores anteriores `/#servicios` y `/#operacion` conducen a su nueva ruta
privada. El enlace retirado `/design-lab.html` conduce al acceso con un aviso; no
vuelve a cargar prototipos. Las direcciones desconocidas muestran 404 con enlaces
útiles. `/app` normaliza a establecimiento. El login solo acepta retornos a las
rutas privadas conocidas, sin redirecciones externas. Las recargas profundas
funcionan con el fallback SPA de Vite; un hosting futuro deberá conservarlo.

Se mantiene la autorización del backend y la sesión local; no es autenticación
comercial de producción. Los enlaces públicos usan navegación nativa y el ámbito
privado conserva sus avisos de cambios pendientes. No se añadió una dependencia de
router: tres áreas privadas y dos rutas públicas no justifican otra librería.
El JavaScript y CSS privados se cargan por importación dinámica; la demo también
se carga bajo demanda. La narrativa adicional se carga al acercarse a ella o al seguir sus enlaces; conserva un acceso manual y recuperación de errores. El hero y la demo tienen entradas independientes. `dist/.vite/manifest.json` permite comprobar esta separación.

La demo usa mensajes, contextos y horarios ficticios en estado React. No llama al
backend, no lee ni escribe localStorage, no utiliza IA y no crea reservas. Elegir
un sector aquí no cambia el sector de ningún establecimiento. Beauty dispone de la
operación inicial local; Dental, Fitness y Automotive siguen planificadas. Reservas,
recepción conversacional, WhatsApp y pagos no se anuncian terminados.

Nomi es una ilustración SVG original de silueta curva, con gestos de bienvenida,
escucha, reflexión, confirmación, celebración y descanso. El saludo animado se reserva para hover/foco; las demás expresiones cambian por interacción. Los cambios visuales usan
transform/opacity, sin bucles JavaScript ni runtime 3D. La animación se pausa fuera
de pantalla o con la pestaña oculta y respeta movimiento reducido. No hay fotos,
imágenes remotas ni fuentes descargadas. Los gradientes pertenecen al material del
personaje; no al fondo. El layout público está separado de los formularios privados.

No hay formulario de leads, contratación ni lista de espera simulada. Por defecto,
los CTA conducen a la demo o al acceso autorizado. Para un canal real de contacto,
configurar `VITE_PUBLIC_CONTACT_URL` con una URL HTTPS controlada en `apps/web/.env`.
Sin destino válido no aparece ese enlace; nunca se declara una solicitud enviada.
Esta variable es pública: no debe contener secretos. No se inventó correo ni teléfono.
Si el destino es `https://wa.me/NUMERO_INTERNACIONAL` (solo dígitos, sin `+`),
la sección Tu sector también muestra «¿Tu giro de negocio no se encuentra aquí?»
y el enlace a WhatsApp con una consulta preparada. Abrirlo no envía el mensaje.

Verificación: `pnpm verify` y `pnpm health`. Lighthouse se ejecutó como herramienta
temporal con `pnpm dlx lighthouse@13.6.0`, sin añadir dependencias al producto,
sobre el build de producción servido temporalmente en 127.0.0.1:4173. Los informes
locales finales se guardan en `.local/noma-production-*.report.html` y `.report.json`.
Son mediciones de laboratorio; INP de campo y los Core Web Vitals reales todavía no
se conocen. Noma sigue siendo provisional hasta validar disponibilidad de marca.

Resultados del build inicial M1.6.2, anteriores al explorador y precios, con los servidores de desarrollo detenidos:

| Perfil Lighthouse 13.6.0 | Rendimiento     | LCP        | CLS | TBT                      |
| ------------------------ | --------------- | ---------- | --- | ------------------------ |
| Móvil, tres ejecuciones  | 100 / 100 / 100 | 769–772 ms | 0   | 12–23 ms (mediana 16 ms) |
| Escritorio               | 100             | 223 ms     | 0   | 0 ms                     |

Accesibilidad automatizada, buenas prácticas y SEO: 100 en las cuatro ejecuciones;
no equivalen a una certificación de accesibilidad. Móvil: 412×823, DPR 1,75,
RTT 150 ms, 1638,4 Kbps y CPU ×4 simulados. Escritorio: 1350×940, DPR 1,
RTT 40 ms, 10240 Kbps y CPU ×1. Chrome headless 156 en Windows, localhost.
Las mediciones anteriores durante desarrollo variaron entre 83 y 100; los
resultados locales no garantizan puntuaciones en hosting ni dispositivos reales.
La auditoría inicial de la landing descargó documento, JS público, CSS y favicon,
sin APIs ni bundle privado. JS inicial: 74,15 kB gzip; CSS: 6,45 kB gzip.

Para repetir, ejecutar `pnpm build`, iniciar `pnpm --filter @beauty-wellness/web preview`
y, en otra terminal con Chrome instalado:

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
pnpm dlx lighthouse@13.6.0 http://127.0.0.1:4173/ --quiet '--chrome-flags=--headless=new --no-first-run --no-default-browser-check' --only-categories=performance,accessibility,best-practices,seo --output=json --output=html --output-path=.local/noma-audit-mobile
# Repetir añadiendo --preset=desktop y cambiando output-path para escritorio.
```

Cerrar el preview con Ctrl+C. La verificación M1.6.2 ejecutó `pnpm verify` completo:
334 pruebas (7 scripts, 162 API, 99 frontend y 66 integración PostgreSQL), lint,
formato, typecheck y builds correctos. `pnpm health` confirmó HTTP 200 de proceso y
base de datos antes del cierre autorizado del entorno. Se comprobaron anchos de
320, 390, 768, 1366 y 1920 px, navegación por teclado y movimiento reducido.

## Arranque y cierre fiables en Windows

Desde la raíz en PowerShell, con PostgreSQL disponible:

```powershell
pnpm dev:local
```

En otra terminal:

```powershell
pnpm dev:status
pnpm health
pnpm dev:stop
```

`dev:local` inspecciona procesos y puertos antes de lanzar el grupo. Si este mismo
checkout ya tiene frontend y API saludables, informa que ya está en ejecución y termina
sin duplicarlos. Si hay un arranque gestionado en curso, tampoco lo duplica. No cambia
5173 a otro puerto. Los puertos configurados se leen de API y de los mismos archivos
de entorno que utiliza Vite; frontend y backend deben usar puertos distintos.

Una instancia parcial, un puerto ajeno o un proceso cuya pertenencia no pueda demostrarse
bloquean el nuevo arranque. Nada se termina automáticamente para liberar el puerto.
`dev:status` muestra PID, pertenencia, salud, instancia y propietario cuando se conocen.
`pnpm dev:status --json` ofrece la misma información para diagnóstico, sin secretos.

`dev:stop` cierra exclusivamente el grupo gestionado del SaaS. No ejecuta comandos de
Docker ni detiene PostgreSQL; no borra datos ni archivos del negocio. Ctrl+C libera
también los dos puertos y los watchers. Algunas instalaciones de pnpm en Windows
muestran después «¿Desea terminar el trabajo por lotes?»; responder S. El grupo del
SaaS ya se ha cerrado antes de esa pregunta de la terminal.

La implementación combina un canal local de control con token, raíz del checkout,
fecha de creación del proceso, inspección CIM y un Windows Job Object privado.
Los hijos se asignan suspendidos al grupo antes de ejecutarse; la caída del host o
del lanzador cierra sus descendientes. `.local/dev-runtime.json` es un registro temporal
ignorado, no la única autoridad: un PID reutilizado no autoriza a cerrar otro proceso.
El host PowerShell usa una política de ejecución limitada a su proceso, sin cambiar
la política del sistema, y funciona sin instalar servicios ni dependencias nuevas.

Cada sesión Codex se identifica por su thread/session ID; las terminales manuales,
por el usuario Windows. El cierre por defecto rechaza una instancia de otra sesión.
Solo después de coordinar con su propietario se puede seleccionar explícitamente:

```powershell
pnpm dev:stop --instance UUID_MOSTRADO_POR_DEV_STATUS
```

Las instancias antiguas iniciadas directamente con Vite/pnpm pueden carecer de un
propietario de sesión verificable. El gestor no las adopta ni las cierra silenciosamente.
Tras identificar y confirmar su uso, copiar el PID y la fecha exactos de `dev:status`:

```powershell
pnpm dev:stop --pid PID_VERIFICADO --started FECHA_UTC_MOSTRADA
```

Esta recuperación vuelve a validar fecha de creación, ejecutable, ruta del proyecto
y descendientes inmediatamente antes del cierre. Un proceso ajeno o interno de
Codex/VS Code se rechaza. No usar búsquedas globales para matar `node.exe`.

Verificación general y prueba específica de ciclos de procesos:

```powershell
pnpm verify
# Solo sin instancias en uso; esta prueba rechaza ocupar puertos ajenos.
pnpm test:dev-processes
```

`verify` incluye las pruebas unitarias del gestor. La prueba de procesos es separada
porque inicia y detiene sus propias instancias reales; no debe ejecutarse mientras
otra persona esté usando el checkout. El script TypeScript conserva los argumentos
separados `tsc -p tsconfig.build.json --watch --preserveWatchOutput`.

## Identidad visual del producto

El producto utiliza una interfaz neutral para barberías, salones y centros de
bienestar: superficies claras, navegación grafito y acento azul. El espacio de
trabajo ocupa el ancho de pantalla; solo los formularios limitan su ancho de lectura.
La barra lateral se puede plegar y recuerda esa preferencia localmente. En móvil
se convierte en un menú desplegable que también se cierra con Escape.
Se conservan los avisos antes de descartar cambios. Brisa es un recurso geométrico
decorativo limitado al acceso y estados vacíos, sin funciones de IA. Las transiciones
respetan `prefers-reduced-motion`. No hay dependencias visuales ni fuentes remotas.
El laboratorio fue retirado; sus marcadores antiguos conducen al producto real.

Para revisar la interfaz: `pnpm dev:local` y http://localhost:5173/.
Para verificarla: `pnpm verify`. Para cerrar el entorno: `pnpm dev:stop`.

## M1.6.1: sector administrado del establecimiento

Orden de desarrollo: **BEAUTY → DENTAL → FITNESS → AUTOMOTIVE**. Solo BEAUTY
habilita la operación actual de desarrollo. El lanzamiento comercial será conjunto
cuando las cuatro verticales estén preparadas y validadas. Alcance y matriz reales
en [APPOINTMENTS_SCOPE.md](docs/product/APPOINTMENTS_SCOPE.md).

Aplicar la migración aditiva con `pnpm db:migrate` y revisar `pnpm db:migrate:status`.
El sector aparece en **Establecimiento**, con terminología y capacidades desplegables.
No es un campo editable del formulario y no se elige desde el navegador.

Las filas antiguas quedan sin clasificar; no se adivina su origen ni se pierden datos.
Para clasificar un establecimiento cuya finalidad esté verificada, usar el UUID
exacto obtenido al crear/renovar su acceso y consultar su versión:

```powershell
pnpm dev:sector --inspect --establishment UUID_DEL_ESTABLECIMIENTO
pnpm dev:sector --establishment UUID_DEL_ESTABLECIMIENTO --vertical BEAUTY --version VERSION_ACTUAL --reason "Evidencia concreta y verificada del origen del establecimiento"
```

`--inspect` es de solo lectura. La asignación requiere evidencia de 20–500 caracteres,
solo admite filas activas sin clasificar y rechaza versiones obsoletas. No crea
establecimientos ni cambia cuentas ya clasificadas. No permite clasificar por lotes
ni elegir otra cuenta automáticamente. Las verticales futuras se rechazan con una
explicación; no se crean configuraciones operativas incompletas. La CLI no funciona
fuera del entorno y la base locales de desarrollo. Para un establecimiento nuevo,
`dev:owner` requiere explícitamente `--vertical BEAUTY`; renovar acceso no modifica
el sector ni exige este argumento. El motivo de clasificación se registra en la base;
no incluyas secretos en él.

El backend obtiene el sector desde la sesión autorizada. Tanto el catálogo como Staff
rechazan capacidades no implementadas, incluso con llamadas HTTP directas. La
configuración general y la sesión local se conservan durante la clasificación.
Los horarios y la valoración previa del catálogo siguen siendo configuración, no
reservas reales ni atención/diagnósticos realizados. No hay nuevos módulos de negocio.

## Renovar el acceso local de desarrollo

Con PostgreSQL local activo, ejecutar desde la raíz en PowerShell:

```powershell
pnpm dev:access
Get-Content .local/owner-access.txt
```

Copiar el código al formulario de acceso del frontend. Es temporal, de un solo uso y
vence en 10 minutos. Después de cerrar sesión o si vence, repetir los dos comandos.
No es necesario detener `pnpm dev:local`. El comando compila la CLI, emite el código
y termina; no inicia otro frontend ni backend.

`dev:access` reutiliza la única membresía almacenada y valida que sea de propietario
activo de un establecimiento activo. Si existen varias membresías (incluso inactivas),
exige elegir explícitamente la correcta; no cambia automáticamente de cuenta:

```powershell
pnpm dev:access --membership UUID_DE_LA_MEMBRESIA
Get-Content .local/owner-access.txt
```

El UUID es el identificado al crear el acceso con `dev:owner` (y se confirma al renovar).
Si no existen membresías o la seleccionada no es válida, el comando falla sin crear
establecimientos, usuarios ni membresías. `--name` y `--owner` no se admiten en
`dev:access`; `dev:owner` conserva su flujo explícito de incorporación inicial.

Solo funciona en desarrollo local, con la base `beauty_wellness_dev`, usuario `bw_local`
y conexión en loopback. Rechaza production, staging y test antes de emitir credenciales.
Conserva tokens aleatorios de 256 bits, hash SHA-256 en PostgreSQL, consumo único y la
caducidad existente. Sustituye únicamente los códigos BOOTSTRAP de la membresía elegida;
no modifica sesiones existentes ni datos comerciales. Los logs no muestran secretos.
El código se guarda sin formato adicional en `.local/owner-access.txt`, ignorado por Git.

## Demostración M1.6: personas, lugares y tiempos

Desde PowerShell en la raíz, con Docker Desktop iniciado:

```powershell
pnpm dev:setup
pnpm dev:local
```

Si los servidores ya están activos, conservarlos. Abrir http://localhost:5173/dev/login y elegir
**Equipo y sucursales** después de acceder con la identidad local existente. También
se puede abrir http://localhost:5173/app/equipo. El código temporal se emite con
`pnpm dev:owner --membership UUID_DE_LA_MEMBRESIA` y se lee de `.local/owner-access.txt`;
no crear otro establecimiento para probar uno existente.

1. **Sucursales:** crear la primera explícitamente, con nombre, dirección opcional y
   zona IANA. Marcar principal solo si corresponde. Elegir otra principal retira la marca
   anterior en una transacción; se permite no tener principal. Para desactivar una
   principal, quitar primero su marca o elegir otra. No se crean sucursales de ejemplo.
2. **Profesionales:** registrar nombre/especialidad, marcar una o varias sucursales y
   servicios del catálogo. No se crean usuarios, correos ni credenciales de profesionales.
   Seleccionar una ficha para editar, desactivar o reactivar. Guardar o descartar la
   edición antes de cambiar estado. Las asociaciones desactivadas se conservan.
3. **Horarios:** seleccionar sucursal y sucursal completa o profesional asignado. Cada
   día puede quedar sin configurar, cerrado o con intervalos locales HH:mm. Añadir un
   segundo intervalo representa una pausa; no se precargan jornadas supuestas. Guardar
   la semana antes de abrir **Excepciones por fecha**, donde se registra ausencia, cierre
   o jornada modificada; seleccionar una excepción permite editarla o cambiar su estado.
4. **Recursos:** crear una cabina, estación o equipo real con sucursal y capacidad entera
   positiva. **Requerimientos por servicio** permite elegir sucursal, servicio, recursos
   de ese lugar y unidades necesarias. Lista vacía: sin recursos adicionales indicados.
   Retirar un recurso de los requerimientos antes de desactivarlo o reducir su capacidad
   por debajo de las unidades requeridas. No se permite trasladar un recurso existente.
5. Recargar el navegador, seleccionar la ficha y volver a elegir el contexto del horario
   o requerimiento para comprobar persistencia. Los borradores se conservan ante errores;
   un conflicto 409 permite cargar datos actuales con confirmación de descarte.

Se comparó un mapa de sucursales (orientación espacial, más cambios de contexto para
ver servicios de una persona) con un directorio de profesionales y ficha contextual.
Se eligió el directorio para responder quién hace qué y dónde; horarios y recursos son
tareas separadas y visibles. La navegación principal tiene solo áreas implementadas,
sin sidebar permanente ni indicadores ficticios. En móvil se apilan directorio y ficha;
controles nativos etiquetados y foco visible permiten teclado y mouse. Las comprobaciones
manuales usan nombres expresamente sintéticos, nunca datos comerciales precargados.

Persistencia: `Branch`, `Professional`, `ProfessionalBranch`, `ProfessionalService`,
`PhysicalResource`, `WorkSchedule`, `ScheduleException`, `ServiceResourceSet` y
`ServiceResourceRequirement`. Todas llevan alcance de establecimiento; entidades
editables tienen versión y fechas, y entidades de negocio se desactivan sin DELETE.
La migración aditiva `20261027000400_staff_operations` añade tablas, FK compuestas
de pertenencia, principal única por establecimiento, horario de sucursal único sin
profesional y CHECK de capacidades/unidades positivas. Conserva las tres migraciones
anteriores y los registros existentes. Se aplica con `pnpm db:migrate`.

Semanas e intervalos son JSONB estructurado validado estrictamente, con máximo técnico
de 7 días y 24 intervalos por día. Horas válidas: 00:00–23:59, inicio menor que fin,
sin superposición; intervalos contiguos son válidos. Omitir un día significa no
configurado, nunca abierto; `closed: true` con lista vacía es cierre explícito.
La zona queda identificada en sucursal y horario; las fechas de excepción son DATE
y se exponen como YYYY-MM-DD, no como instantes de cita UTC. Una excepción por fecha
y horario, incluso si está inactiva: editar/reactivar la existente evita ambigüedad.

Todas las rutas están bajo `/api/staff`, protegidas por el guard local M1.4:

| Método y ruta                                                                      | Operación                                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `GET /configuration`                                                               | Configuración completa exclusivamente del tenant autorizado               |
| `POST /branches`, `/professionals`, `/resources`                                   | Crear ficha                                                               |
| `PATCH /branches/:id`, `/professionals/:id`, `/resources/:id`                      | Editar con versión                                                        |
| `PATCH /branches/:id/status`, `/professionals/:id/status`, `/resources/:id/status` | Activar/desactivar con versión                                            |
| `PUT /schedules`                                                                   | Guardar semana por sucursal y profesional opcional; versión nula al crear |
| `POST /schedules/:id/exceptions`                                                   | Registrar excepción por fecha                                             |
| `PATCH /exceptions/:id`, `/exceptions/:id/status`                                  | Editar o cambiar estado de excepción                                      |
| `PUT /branches/:branchId/services/:serviceId/resources`                            | Reemplazar requerimientos, con versión nula al crear                      |

Tenant desde sesión, DTOs sin campos administrativos arbitrarios, referencias ajenas
404, formulario inválido 400 y conflictos 409. Nuevas asignaciones requieren entidades
activas; se pueden conservar o retirar asociaciones anteriores con entidades inactivas.
Sucursales/profesionales inactivos conservan horarios para consulta, sin habilitar
nuevas escrituras operativas. Los reemplazos de asociaciones y principal usan transacción
y coordinación de configuración por tenant; esto no bloquea ni comprueba citas.
La lectura de referencias de Oferta solo valida pertenencia/estado; Staff no cambia precios.

Verificación desde la raíz (API activa para `health`):

```powershell
pnpm verify
pnpm health
```

La integración comprueba primero la identidad de la base separada `beauty_wellness_test`
y limpia solo los IDs generados por cada suite. No usar `db push`, `migrate reset` ni
borrar volúmenes. `pnpm db:stop` detiene PostgreSQL conservando los datos.

Pendientes de negocio: jornadas que cruzan medianoche; precedencia/intersección entre
horario de sucursal, profesional y excepciones; política ante zonas con cambios de hora;
traslado de recursos; efecto de cambios sobre citas futuras. Por ahora se bloquea cambiar
la zona de sucursales con horarios, para no reinterpretarlos. No se infieren horarios al
retirar una asignación: sus registros quedan conservados y requieren revisar el contexto.
Todo cálculo de disponibilidad, reservas y conflictos de agenda queda fuera de M1.6.
La autenticación comercial sigue pendiente; el acceso local permanece cerrado en producción.
No se modifican documentos aprobados de producto, arquitectura, stack ni diseño.

## Demostración M1.5: catálogo comercial

Desde la raíz, con Docker Desktop iniciado, aplicar las migraciones versionadas y abrir
el modo local. No iniciar otro servidor en los mismos puertos si ya hay uno activo:

```powershell
pnpm dev:setup
pnpm dev:local
```

Usar la identidad M1.4 existente; para emitir otro código sin duplicar registros:

```powershell
pnpm dev:owner --membership UUID_DE_LA_MEMBRESIA
Get-Content .local/owner-access.txt
```

Para una instalación sin propietario, crear uno explícitamente con `--name`, `--owner` y `--vertical BEAUTY`
según la sección M1.4. No se cargan servicios ni precios de ejemplo automáticamente.
Abrir http://localhost:5173/dev/login, acceder con el código y pulsar **Servicios**. La dirección
http://localhost:5173/app/servicios conserva el área al recargar, sin identificar tenants.

1. Crear servicio: introducir nombre y duración entera en minutos. Categoría y descripción
   son opcionales; no se presupone una duración comercial.
2. Elegir precio fijo, desde, rango o sujeto a valoración. Introducir importes decimales
   como texto; el formulario permite coma decimal y la normaliza antes del envío.
3. En valoración, los importes permanecen nulos. Se puede marcar que el negocio tiene
   una evaluación previa descrita y explicar su proceso; no significa que un cliente
   ya fue evaluado ni determina gratuidad, cobros, citas o aceptación de cotizaciones.
4. Guardar, seleccionar el servicio del índice y editarlo. Desactivar conserva sus datos;
   puede reactivarse. Buscar por nombre/categoría y filtrar activos/inactivos.
5. Recargar y comprobar que el catálogo se recupera de PostgreSQL. Las ediciones pendientes
   piden confirmación antes de cambiar de servicio, volver o recargar datos, y se conservan
   ante errores. Una versión antigua devuelve 409 para evitar sobrescrituras.

UX: se comparó índice editorial con editor contiguo frente a fichas a pantalla completa.
Se eligió el índice para reconocer nombres/precios, cambiar entre servicios y editar sin
buscar filas en una tabla; en móvil se apila y la selección lleva el foco al nombre del
editor. En M1.5 existían las áreas Establecimiento y Servicios, sin sidebar permanente,
tarjetas KPI ni módulos ficticios. Las cuatro modalidades se representan como importe
exacto, «Desde», rango o «Precio sujeto a valoración», sin sustituir desconocido por cero.
Las capturas y los cuatro registros creados durante la comprobación manual están
rotulados como validación sintética; no son ofertas reales ni datos precargados.

Modelo mínimo `ServiceOffering`: UUID, establecimiento propietario, nombre, categoría
opcional, descripción, duración, modalidad, importes, moneda, evaluación descriptiva,
activo/inactivo, versión y fechas. La migración `20261027000300_service_catalog` añade
la tabla, FK e índice por establecimiento/estado/categoría. Incluye CHECK de duración,
nombre no vacío, forma del precio y coherencia de la descripción de evaluación.
Las migraciones históricas y `PersistenceProbe` se conservan.

Dinero: `Decimal(18,4)` permite hasta 14 cifras enteras y 4 decimales como límite técnico.
El API exige cadenas, rechaza números JSON, exponentes, negativos y escalas superiores a
la moneda (USD: 2; JPY: 0; BHD: 3). Compara con `Prisma.Decimal`; el navegador utiliza
`BigInt` para la parte entera y texto para la fracción. No hay `Number(importe)`, floats,
redondeos silenciosos ni conversiones cambiarias. Rango admite máximo igual al mínimo.

Cada servicio conserva la moneda del establecimiento al crearlo; no puede editarse desde
el DTO. Cambiar la moneda de Plataforma no reinterpreta registros anteriores. Crear
requiere `X-Catalog-Currency` como precondición de la moneda mostrada: el servidor la
compara con el contexto autorizado y devuelve 409 si cambió, sin usar el encabezado para
elegir una moneda arbitraria. En ese caso, conservar el borrador y volver al establecimiento
para cargar la configuración actual. La política comercial definitiva de moneda sigue pendiente.

| Endpoint                                  | Acción                                                            |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `GET /api/offering/services`              | Listar exclusivamente el catálogo autorizado, incluidos inactivos |
| `GET /api/offering/services/:id`          | Consultar un servicio propio; inexistente/ajeno devuelve 404      |
| `POST /api/offering/services`             | Crear; tenant y moneda provienen del contexto, no del DTO         |
| `PATCH /api/offering/services/:id`        | Editar el formulario comercial con `version`                      |
| `PATCH /api/offering/services/:id/status` | Cambiar únicamente `active` con `version`                         |

Todas las rutas usan el guard de identidad local M1.4: sin sesión 401, origen o membresía
no autorizados 403, modo production/staging o local deshabilitado 404. Los identificadores
de tenant, moneda, estado administrativo y otros campos extra se rechazan en el DTO;
listar tampoco admite parámetros para sustituir el establecimiento. No hay endpoint DELETE.
Oferta reutiliza el módulo técnico de acceso local; no importa servicios ni repositorios
comerciales privados de Plataforma. Las consultas y escrituras filtran por su tenant.

Pruebas desde la raíz:

```powershell
pnpm verify
pnpm health
```

`health` requiere la API iniciada. La integración utiliza la base aislada y verifica su
identidad antes de migrar o escribir; limpia únicamente sus tenants sintéticos. Comprueba
las cuatro modalidades, precisión en importes grandes, CRUD, activación, SQL CHECK,
aislamiento A/B, contexto inyectado, moneda concurrente, falta de sesión y modo no local.
Las pruebas React cubren carga, vacío, búsqueda, creación, edición, guardado, valoración,
cambio de estado, errores y protección de borradores. No se añaden dependencias.

Resultado ejecutado de M1.5: `pnpm verify` terminó con salida 0; 98 pruebas API, 35 de
frontend y 35 de integración (168 aprobadas). Lint, typecheck y ambos builds pasaron.
`pnpm health` devolvió ambos contratos HTTP 200; las tres migraciones están aplicadas
y `prisma migrate diff` no detectó diferencias de schema. Se comprobaron en navegador
las cuatro modalidades, edición, desactivación/reactivación, recarga persistente y error
de rango conservando el borrador; los importes se contrastaron en PostgreSQL. Se revisaron
1440×1100 y 375×812 sin desbordamiento horizontal. Capturas: `.local/m15-catalog-desktop.png`
y `.local/m15-catalog-mobile.png`. Los documentos aprobados y las migraciones históricas
conservaron sus hashes; la base de pruebas quedó sin registros sintéticos residuales.

La búsqueda y los filtros operan sobre el catálogo autorizado cargado en el navegador;
no se implementó paginación ni se afirmó validar rendimiento de catálogos grandes.

Decisiones aún abiertas: OQ-COM-02/03 (variantes, moneda/impuestos/comprobantes),
OQ-COM-04/05 (elegibilidad y cobro de valoraciones), OQ-COM-06/07/08 (facultades y acuerdos)
y OQ-AGE-01 (preparación y capacidad). No se resuelven mediante los límites técnicos de
este catálogo. No se implementan reservas, profesionales, sucursales, cobros, descuentos,
impuestos, presupuestos emitidos ni integraciones; autenticación comercial y RLS siguen pendientes.

## Demostración M1.4: establecimiento autorizado

Con Docker Desktop iniciado, desde la raíz, preparar/aplicar las migraciones:

```powershell
pnpm dev:setup
pnpm dev:owner --name "Nombre de tu establecimiento" --owner "Nombre del propietario" --vertical BEAUTY
pnpm dev:local
```

`dev:owner` crea explícitamente un establecimiento, una identidad interna y su membresía
OWNER, sin datos personales adicionales ni seeds automáticos. Usa nombres elegidos por
el desarrollador; no crea clientes ni sucursales. La CLI comprueba el nombre y usuario
efectivos de la base local de desarrollo antes de escribir. Su salida muestra los UUID
de membresía/establecimiento y la ruta del código, nunca el código mismo.

Abrir **http://localhost:5173/dev/login**, no otro origen distinto de `WEB_ORIGIN`.
En otra terminal, leer el archivo y copiar el código al campo de acceso:

```powershell
Get-Content .local/owner-access.txt
```

El código vence a los 10 minutos y se consume una única vez, incluso ante solicitudes
concurrentes. No pegarlo en URLs ni compartirlo. Tras acceder, editar el nombre comercial,
guardar y recargar. El formulario admite teléfono comercial y sitio web opcionales,
zona horaria IANA y moneda ISO, con Ecuador continental/USD como valores iniciales.
Galápagos y otras zonas/monedas son seleccionables; no se supone una única ciudad.

Para emitir otro código sin duplicar identidades o establecimientos, usar la membresía
que imprimió la CLI:

```powershell
pnpm dev:owner --membership UUID_DE_LA_MEMBRESIA
```

`pnpm dev` conserva el arranque normal, con acceso comercial cerrado por defecto.
`dev:local` es un opt-in temporal: activa `NODE_ENV=development`, `APP_ENV=local` y
`LOCAL_ACCESS_ENABLED=true` solo en sus procesos hijos. Ambos lanzadores rechazan una
configuración previa production, staging o test; no cambian variables globales ni `.env`.
El backend exige las tres condiciones, DB en loopback sin parámetros que cambien la red,
conexión HTTP loopback y origen permitido para escrituras. Un flag aislado no habilita acceso.

La sesión dura 8 horas, está ligada a una membresía concreta y se mantiene con cookie
HttpOnly/SameSite=Strict; no se almacena en localStorage/sessionStorage ni se devuelve en JSON.
Los secretos son aleatorios de 256 bits y PostgreSQL guarda únicamente sus hashes SHA-256.
La cookie usa HTTP local sin `Secure`: esta implementación solo se permite en un equipo
de desarrollo confiable, sin túneles, proxy público ni carpeta del proyecto compartida.
El archivo temporal `.local/owner-access.txt` está ignorado; no versionar ni distribuir `.local/`.
Cerrar sesión elimina la credencial. La pertenencia/estado del establecimiento se revalidan
en cada petición y en las consultas de edición. No existen permisos implícitos sin sesión.

| Endpoint                                 | Acceso y comportamiento                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `POST /api/local-access/session`         | Código CLI vigente de un solo uso, origen autorizado y modo local; cookie HttpOnly, HTTP 204 |
| `DELETE /api/local-access/session`       | Modo local/origen autorizado; revoca la cookie y la credencial, HTTP 204                     |
| `GET /api/platform/context`              | Sesión local válida y membresía OWNER activa; identidad y establecimiento autorizado         |
| `GET /api/platform/establishments/:id`   | Solo el establecimiento ligado a la sesión; otro UUID devuelve 403                           |
| `PATCH /api/platform/establishments/:id` | Misma autorización; DTO cerrado a campos comerciales y versión                               |

Sin sesión: 401. Membresía revocada/tenant ajeno/origen inválido: 403. Modo local cerrado
o establecimiento suspendido: 404. Datos inválidos/campos administrativos: 400. Una versión
de edición obsoleta produce 409, conservando el borrador en pantalla. Los errores de red o
sesión vencida tampoco vacían el formulario; recargar/salir con cambios pide confirmación.
Los campos `id`, `status`, suscripciones, tenant y privilegios no son editables desde el DTO.

Modelo: `Establishment` (tenant comercial, no sucursal), `InternalUser`, `Membership`
(relación muchos-a-muchos con unicidad usuario/establecimiento) y `LocalCredential` temporal.
Se añade `20261027000200_local_establishment`; la migración histórica y `PersistenceProbe`
se conservan. No hay RLS. La frontera comercial definitiva de OQ-PRO-02 y el proveedor de
identidad siguen pendientes; este modelo no aprueba gestión de sucursales ni autenticación comercial.

Dirección visual propuesta, pendiente de revisión: se comparó formulario lineal frente a
composición editorial asimétrica y se eligió esta última para separar orientación de edición.
No hay sidebar, KPI ni menús vacíos. Colores crema/verde, serif de sistema en el título,
controles nativos etiquetados, foco visible y apilado en móvil; sin biblioteca visual nueva.
La acción principal es guardar; los datos opcionales están marcados y no hay información
empresarial inventada. La demostración realizada está rotulada como datos sintéticos.

Verificación: `pnpm verify`, `pnpm health` con el servidor iniciado. Las pruebas nuevas
incluyen DTO, política local, aislamiento A/B (también con usuario en varias membresías),
revocación, campos prohibidos, concurrencia de códigos, caducidad, producción/staging,
persistencia real y estados React. Se comprobó en navegador acceder, editar, guardar,
recargar, foco por teclado y distribución de escritorio/móvil; el valor se contrastó
directamente en PostgreSQL. Capturas locales de revisión en `.local/`, sin secretos.

Resultado ejecutado de M1.4: `pnpm verify` terminó con salida 0, con 58 tests de API,
18 de frontend y 19 de integración PostgreSQL (95 en total); lint, typecheck y builds
pasaron. `pnpm health` devolvió ambos contratos HTTP 200 y las dos migraciones están
aplicadas. Se revisaron 1440×1000 y 375×812, sin desbordamiento horizontal en móvil.
El lanzador local se rechazó al forzar NODE_ENV production y el guard HTTP rechazó
production/staging aun con la bandera activada. La dirección visual continúa pendiente
de revisión del desarrollador.

Pendiente antes de uso comercial: proveedor de identidad, recuperación, administración de
accesos, auditoría, políticas definitivas de tenant/sucursal, RLS y protección de producción
con HTTPS. No usar esta capacidad como login comercial. No se implementan otros dominios.

## Requisitos

- Node.js 24 LTS, mínimo 24.22.0, referencia en `.node-version` y `engines`.
- pnpm 11.25.0, fijado en `packageManager`. Corepack es opcional si ya tienes pnpm.
- Docker Desktop para Windows, motor Linux iniciado y Docker Compose v2 o posterior con soporte `--wait`.
  WSL2 debe estar instalado y habilitado si se utiliza ese backend de Docker Desktop.
- Puertos libres: 5173 y 3000 para web/API; 55432 y 55433 para PostgreSQL local y tests.

No se instalan ni actualizan herramientas globales desde este proyecto.

## Preparación desde PowerShell

Desde la raíz del repositorio (`C:\Users\Jorge\beauty-wellness-saas` en este equipo),
con Docker Desktop iniciado:

```powershell
pnpm dev:setup
pnpm dev
```

`dev:setup` copia los cuatro ejemplos `.env` solo cuando faltan, instala mediante lockfile
congelado, inicia PostgreSQL de desarrollo, verifica disponibilidad, valida el schema,
genera Prisma Client, aplica las migraciones versionadas y comprueba su estado.
Puede repetirse: conserva todos los `.env` existentes y los volúmenes. Se detiene ante
el primer fallo. No actualiza credenciales de bases ya inicializadas ni sincroniza
automáticamente configuraciones personalizadas: revisar las URLs y puertos existentes.
No se ejecuta en producción. Revisar los SQL nuevos antes de invocarlo: la aplicación
de migraciones ocurre al pedir explícitamente `dev:setup` o `db:migrate`, nunca por `dev`.

Para preparar únicamente los ejemplos sin Docker ni dependencias: `pnpm env:setup`.
Para instalar únicamente dependencias: `pnpm install --frozen-lockfile --store-dir .pnpm-store`.
No se usan comandos Unix ni scripts de PowerShell con políticas de ejecución especiales.

Los ejemplos contienen credenciales sintéticas exclusivamente locales; no reutilizarlas
fuera de tu equipo. Los `.env` locales están ignorados. Los archivos de ejemplo sí se versionan.
Si cambias credenciales, puerto o nombre de base, actualiza también la URL correspondiente.
Prisma Client se genera explícitamente y también antes de cada build de API; no se ejecutan
migraciones al arrancar la aplicación.

- Frontend: http://localhost:5173
- Proceso API: http://localhost:3000/api/health → `{"status":"ok","service":"api"}`
- PostgreSQL: http://localhost:3000/api/health/db → `{"status":"ok","service":"database"}`
  cuando responde la base; HTTP 503 con mensaje genérico cuando está indisponible.

`pnpm dev` inicia ambos procesos en primer plano. `Ctrl+C` los detiene. Puedes iniciarlos
por separado con `pnpm --filter @beauty-wellness/api dev` y
`pnpm --filter @beauty-wellness/web dev`.

## PostgreSQL local

`compose.yaml` usa la imagen oficial `postgres:18.6-bookworm`, proyecto
`beauty-wellness-local`, healthcheck `pg_isready` y reinicio manual (`restart: "no"`).
Publica exclusivamente en `127.0.0.1`. El volumen se monta en `/var/lib/postgresql`;
la imagen PostgreSQL 18 utiliza su directorio versionado `/var/lib/postgresql/18/docker`.

Desarrollo y tests tienen contenedores, bases, usuarios, puertos y volúmenes distintos.
El servicio de pruebas se activa con el perfil `test`:

```powershell
pnpm db:up
pnpm db:check
pnpm db:test:up
pnpm db:status
pnpm db:stop
```

`db:stop` detiene ambos servicios sin eliminar volúmenes. Los datos sobreviven a reinicios.
No ejecutar `docker compose down -v`, `migrate reset` ni comandos de borrado de volúmenes
como parte del flujo habitual. Cambiar las variables de inicialización no cambia las
credenciales de un volumen existente: resolverlo explícitamente sin borrar datos.
Este Compose es exclusivamente local, no un despliegue de producción.

## Variables de entorno

| Archivo                  | Variables                                                            | Uso                                                                                    |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `.env` raíz              | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Servicio local, puerto predeterminado 55432                                            |
| `.env` raíz              | `POSTGRES_TEST_PASSWORD`, `POSTGRES_TEST_PORT`                       | Servicio aislado de tests, puerto predeterminado 55433                                 |
| `apps/api/.env`          | `DATABASE_URL`                                                       | Prisma CLI y runtime usan la misma URL PostgreSQL                                      |
| `apps/api/.env`          | `API_PORT`, `NODE_ENV`, `WEB_ORIGIN`                                 | Puerto 3000; entorno validado; CORS limitado a un origen explícito                     |
| `apps/api/.env.test`     | `TEST_DATABASE_URL`                                                  | Solo loopback, usuario `bw_test`, base `beauty_wellness_test`, schema público          |
| `apps/web/.env` opcional | `VITE_API_BASE_URL`                                                  | Base HTTP pública, predeterminada `/api`; nunca incluir secretos                       |
| `apps/web/.env` opcional | `API_PROXY_TARGET`                                                   | Proxy Vite, predeterminado `http://localhost:3000`; variable privada del servidor Vite |
| `apps/web/.env`          | `WEB_PORT`                                                           | Puerto privado del servidor Vite, predeterminado 5173; entero entre 1 y 65535          |

La API y Prisma CLI cargan `apps/api/.env` con una ruta anclada al workspace, sin depender
del directorio del llamador. Las pruebas reales cargan `.env.test` por ruta absoluta,
validan su destino y reemplazan `DATABASE_URL` solo en su proceso y en el CLI hijo.
Las variables ya exportadas prevalecen sobre los archivos; revisar que no apunten a otra base.
No mostrar URLs con credenciales ni contraseñas en logs o capturas.

La API exige una URL PostgreSQL válida, sin credenciales incrustadas en código. La conexión
es perezosa para que una caída de DB no impida responder al health del proceso. Existe un
Prisma Client por aplicación, adaptador `PrismaPg`, pool de hasta cinco conexiones,
espera de conexión/consulta de 1500 ms y límite de respuesta del chequeo de 2000 ms.
Los timeouts del driver acotan también el trabajo subyacente. El cierre de Nest desconecta
el cliente y su pool. El chequeo DB ejecuta únicamente `SELECT 1`, sin escribir datos.
No garantiza disponibilidad de tablas ni integraciones externas.

La web conserva la interfaz M1.1 y consulta únicamente el health del proceso mediante
el proxy de Vite. El proxy existe solo en desarrollo; un despliegue estático futuro
necesitará resolver `/api` y configurar CORS. No hay despliegue configurado.

## Prisma y migraciones

API mantiene CommonJS; el generador `prisma-client` declara `moduleFormat = "cjs"` y
salida explícita `src/generated/prisma`. El cliente generado se ignora en Git y se compila
con TypeScript. `prisma.config.ts` contiene rutas y URL de CLI; el datasource del schema
solo declara el proveedor. CLI, cliente y adaptador están fijados en 7.10.1; no se usa Prisma 8 RC.

Único modelo: `PersistenceProbe`, con UUID, mensaje técnico y fecha de creación.
Migración inicial: `20261027000100_persistence_probe`. Es infraestructura temporal de
verificación, sin datos personales ni semillas. Debe retirarse mediante una migración
futura cuando deje de ser necesaria; no es el modelo de dominio definitivo.

```powershell
pnpm prisma:validate
pnpm prisma:generate
pnpm db:migrate
pnpm db:migrate:status
pnpm --filter @beauty-wellness/api prisma:migrate:dev --name descripcion_del_cambio
```

`db:migrate` aplica migraciones versionadas con `migrate deploy`. `migrate dev` se reserva
para crear cambios en desarrollo; no se usa como procedimiento de producción. No se usa
`db push`, reset, seeds ni migraciones automáticas de arranque.

## Pruebas y calidad

Después de `pnpm dev:setup`, todas las verificaciones con un solo comando:

```powershell
pnpm verify
```

`verify` valida y genera Prisma, inicia/verifica la base de desarrollo, comprueba que no
hay migraciones pendientes, inicia la base aislada de tests y ejecuta lint, typecheck,
tests habituales, integración PostgreSQL real y ambos builds, en ese orden. Falla ante
el primer error. No requiere tener `pnpm dev` abierto: los tests HTTP levantan su propia
aplicación Nest. Solo la suite de integración aplica migraciones en la base de tests
después de verificar su identidad. Si desarrollo tiene migraciones pendientes, aplicar
explícitamente `pnpm db:migrate` tras revisarlas y repetir la verificación.

Con `pnpm dev` abierto en otra terminal, comprobar además los procesos reales:

```powershell
pnpm health
```

`health` lee `API_PORT` del entorno o de `apps/api/.env`, comprueba ambos endpoints
en loopback con timeout y exige HTTP 200 y el contrato JSON correcto. Devuelve error
si la API o DB no están disponibles, sin imprimir secretos.

Comandos individuales conservados:

| Comando                                                     | Acción                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm db:up` / `pnpm db:check` / `pnpm db:status`           | Iniciar con espera saludable / comprobar `pg_isready` / consultar contenedores |
| `pnpm prisma:validate` / `pnpm prisma:generate`             | Validar schema / generar cliente                                               |
| `pnpm db:migrate` / `pnpm db:migrate:status`                | Aplicar migraciones existentes / consultar estado                              |
| `pnpm db:test:up` / `pnpm test:integration`                 | Iniciar base aislada / ejecutar integración real                               |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` | Calidad y pruebas por separado                                                 |
| `pnpm format` / `pnpm format:check`                         | Aplicar / comprobar formato                                                    |
| `pnpm db:stop`                                              | Detener ambas bases conservando datos                                          |

Para cerrar: primero `Ctrl+C` en la terminal de `pnpm dev`, después `pnpm db:stop`.
No se detienen otros proyectos Docker. Para volver a trabajar: `pnpm db:up` y `pnpm dev`.

`pnpm test` ejecuta Jest de API y Vitest/Testing Library de web, sin exigir PostgreSQL.
Los tests HTTP controlados usan un doble de conexión y no se presentan como integración real.
`pnpm test:integration` exige PostgreSQL real: rechaza URLs remotas, nombres o usuarios
inesperados y verifica `current_database()` y `current_user` antes de migrar o escribir.
Aplica `migrate deploy` exclusivamente al destino de tests, comprueba conexión y health,
crea un registro sintético con UUID propio, lo recupera, compara valores y lo elimina
filtrando por su identificador y mensaje. No vacía tablas ni resetea la base.
No omite silenciosamente las pruebas cuando falta PostgreSQL: el comando falla.

`pnpm format` y `pnpm format:check` cubren código/configuración y README, excluyendo
`docs/` y código generado. Tras build, `pnpm --filter @beauty-wellness/api start` inicia
la API; `pnpm --filter @beauty-wellness/web preview` sirve el bundle en puerto 4173,
sin proxy API. Para el circuito completo de desarrollo, usar `pnpm dev`.

## Estructura

```text
scripts/                     # Preparar ejemplos, comprobar DB y health HTTP
compose.yaml                 # Solo PostgreSQL local y perfil de tests
.env.example                 # Variables Compose sintéticas
apps/api/
  prisma.config.ts
  prisma/schema.prisma
  prisma/migrations/20261027000100_persistence_probe/migration.sql
  src/persistence/            # Cliente único, pool, cierre y validación
  src/platform/               # Establecimiento, identidad local, DTO y autorización
  src/offering/               # Catálogo, reglas monetarias y operaciones autorizadas
  src/health/                # Health de proceso y DB separados
  src/generated/prisma/      # Generado, ignorado
  test/                      # HTTP, guardas y suite PostgreSQL real
apps/web/                    # Workspace y catálogo; clientes HTTP y pruebas React
docs/                        # Documentación aprobada, intacta
```

## Resultado de validación de M1.3

El bloqueo inicial por ausencia de Docker quedó resuelto. Se verificó el motor Linux de
Docker Desktop 4.97.0, Docker Engine 29.9.2 y Compose 5.6.1. `docker compose config --quiet`
pasó y ambos servicios iniciaron con healthcheck satisfactorio. El servidor confirmó
PostgreSQL 18.6 y PGDATA `/var/lib/postgresql/18/docker`.

Se ejecutó `pnpm dev:setup` con instalación congelada, validación del schema y generación
Prisma 7.10.1. Conservó por hash los tres `.env` preexistentes y creó el cuarto desde
su ejemplo. La repetición de `env:setup` conservó los cuatro archivos. Las migraciones
de desarrollo están actualizadas; la suite real confirmó las de tests. No se ejecutaron
resets ni borrados de volúmenes ni se modificaron versiones del lockfile.

| Comprobación ejecutada                                   | Resultado                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Typecheck, lint y formato                                | Correctos                                                                        |
| `pnpm verify` completo                                   | Correcto, incluida base de pruebas y migraciones                                 |
| Build API y web                                          | Correctos                                                                        |
| Tests Jest de API, incluidas regresiones M1.1            | 27 aprobados                                                                     |
| Tests Vitest de frontend                                 | 5 aprobados                                                                      |
| Integración contra PostgreSQL real                       | 4 aprobados: conexión, crear/leer/eliminar, health DB y health de proceso        |
| Arranque conjunto con `pnpm dev`                         | Correcto; puertos predeterminados 5173 y 3000                                    |
| HTTP directo de proceso y DB; proxy Vite y documento web | 200                                                                              |
| `pnpm health` con API y DB activas                       | Ambos contratos HTTP 200 válidos                                                 |
| Detección de servicios detenidos                         | `db:check` y `health` fallan con salida no cero                                  |
| `Ctrl+C` del desarrollo                                  | Puertos liberados y cero conexiones API residuales                               |
| `pnpm db:stop`                                           | Ambos contenedores detenidos con salida 0; mismos volúmenes y fechas de creación |
| Reinicio de PostgreSQL                                   | Disponibilidad recuperada y migración conservada                                 |
| `WEB_PORT=5174`                                          | Vite responde HTTP 200 en el puerto alternativo                                  |
| `WEB_PORT=0`                                             | Configuración rechazada antes de iniciar Vite                                    |

La caída real de DB, recuperación sin reiniciar API y persistencia de un registro entre
reinicios ya se verificaron en M1.2; no se presentan como pruebas nuevas de M1.3.
Se ajustó `db:status` para mostrar también servicios detenidos, se hizo configurable el
puerto de Vite y se alineó el mínimo Node con el runtime 24.22.0 usado por el proyecto.
No se añadieron dependencias ni se modificó la interfaz. Los diez documentos originales
conservaron sus hashes SHA-256.
La revisión visual manual del navegador sigue pendiente; las comprobaciones HTTP y de DOM
sí se ejecutaron. No quedan bloqueos técnicos en las verificaciones de M1.3.

En Windows, si un puerto está ocupado:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 55432,55433,3000,5173
```

Identificar su propietario antes de detener procesos. Para PostgreSQL, cambiar
`POSTGRES_PORT` o `POSTGRES_TEST_PORT` y la URL correspondiente. Si cambia `API_PORT`,
actualizar `API_PROXY_TARGET`; si cambia `WEB_PORT`, actualizar también `WEB_ORIGIN`.
Vite usa puerto estricto. CORS exige un origen HTTP/HTTPS sin comodín, ruta ni credenciales;
`WEB_ORIGIN` es obligatorio explícitamente en producción. API y web escuchan en loopback.

Si Node informa `UNABLE_TO_VERIFY_LEAF_SIGNATURE` en esta red, habilitar los certificados
del sistema para la sesión, sin desactivar TLS:

```powershell
$env:NODE_OPTIONS = '--use-system-ca'
pnpm install --frozen-lockfile --store-dir .pnpm-store
```

Se conservan Node 24, pnpm 11.25.0, Nest 11.2.8, React 19.3.1, Vite 8.3.5 y TypeScript 5.9.3.
Prisma/cliente/adaptador 7.10.1, pg 8.23.1 y dotenv 18.0.9 se instalan solo en API.
ESLint 10.13.0 y TypeScript ESLint 8.72.0 mantienen sus peers compatibles y la espera mínima
de dependencias de 24 horas. Los scripts nativos se autorizan por versión exacta.
Existe una advertencia transitiva de `glob@10.5.0` obsoleto en herramientas de test.
El pnpm incluido en este entorno usa Node 24.22.1; el runtime global no se modifica.

En la validación histórica M1.3 no se implementaron autenticación comercial/OIDC, RLS, sucursales, agenda, CRM, IA,
WhatsApp, pagos, colas, outbox, analítica ni despliegue. No se modifican PRD, preguntas,
arquitectura ni principios de diseño. M1.6 se describe al comienzo de este README.

Fuentes oficiales consultadas: [generador Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators),
[configuración Prisma 7](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference) e
[imagen oficial PostgreSQL](https://hub.docker.com/_/postgres).

# Noma Control · M1.6.5

Panel interno de Vértice EC, separado del panel de negocio. Con el entorno iniciado
mediante `pnpm dev:local`, entrar en `http://localhost:5173/control`. Usa la sesión
comercial existente: iniciar sesión en `/login` y volver a `/control`. Los códigos
locales de propietario y el rol OWNER de un establecimiento **no** conceden acceso.

Rutas: `/control`, `/control/solicitudes`, `/control/negocios`,
`/control/suscripciones`, `/control/usuarios` y `/control/auditoria`.
Las listas se paginan en servidor (25 filas, máximo 50); la búsqueda usa el inicio
del nombre o un UUID completo. Auditoría busca UUID de actor o recurso.

| Permiso de plataforma | Operaciones disponibles                                          |
| --------------------- | ---------------------------------------------------------------- |
| PLATFORM_OWNER        | Consultas, decisiones, pilotos y permisos internos limitados     |
| PLATFORM_ADMIN        | Consultas, decisiones y pilotos; no asigna permisos internos     |
| BILLING_MANAGER       | Resumen y consulta de planes y pilotos                           |
| SUPPORT_AGENT         | Resumen, solicitudes y datos administrativos mínimos de negocios |

No hay acceso automático a servicios privados, clientes, conversaciones ni
impersonación. No se cambian correos, contraseñas ni sector del negocio.

## Primer propietario de plataforma

No se asigna durante migraciones, registro ni solicitudes web. No se ha autorizado
ninguna cuenta real como parte de esta implementación. Un operador autorizado debe
identificar fuera de banda el UUID de `InternalUser` asociado a una identidad
comercial **ya verificada y vinculada**; no usar coincidencia de correo como prueba.
Tras revisar y autorizar expresamente a esa persona, ejecutar desde PowerShell:

```powershell
$env:APP_ENV = 'local'
pnpm control:bootstrap --user 'UUID_INTERNO' --confirm-user 'UUID_INTERNO' --reason 'Motivo administrativo de al menos diez caracteres' --evidence 'Referencia de autorización revisada fuera de banda'
```

El comando solo admite `NODE_ENV=development`, `APP_ENV=local`, PostgreSQL en
loopback, base `beauty_wellness_dev` y usuario `bw_local`. No crea cuentas ni sesiones.
Exige el mismo UUID dos veces, rechaza identidades sintéticas/no verificadas, registra
auditoría y evita un segundo propietario activo incluso ante concurrencia. Repetir
con el mismo propietario es idempotente. Nunca incluir tokens o contraseñas en motivos
o evidencias. Los otros tres roles se asignan por el propietario desde Usuarios y permisos,
con motivo y confirmación del UUID. No se puede cambiar el propio rol ni el del propietario.

## Decisiones y pilotos anteriores (M1.6.5)

La decisión de una solicitud pendiente es final en este milestone: aprobar no crea
un negocio, membresía, suscripción ni pago. Un piloto requiere aprobación previa,
plan propuesto, motivo y vencimiento futuro de hasta 90 días. Puede vincularse
explícitamente a una membresía OWNER existente del solicitante. Desde M1.6.6, sin
membresía autoriza el alta de un único negocio Beauty mediante `/onboarding`.
No se crea un negocio automáticamente al autorizar el piloto.

El piloto permite suspender, reanudar hasta el vencimiento original, cambiar la
propuesta de plan o finalizar definitivamente. No se prolonga ni sustituye una
relación comercial activa. Su validez se comprueba en cada petición del negocio;
vencer o suspender bloquea acceso sin borrar datos. La pantalla de activación informa
aprobación, rechazo y estado del piloto. Los precios se reutilizan del contrato
existente; no hay cobros, comprobantes, cuotas ni medición de IA.

Cada escritura exige origen exacto, permiso actual en backend, versión del registro,
UUID confirmado y motivo. Los reintentos conservan su identificador; decisiones
contradictorias se rechazan y los cambios exitosos se auditan en la misma transacción.
La auditoría ordinaria es de solo lectura y omite secretos del proveedor y de sesión.
Se propone retenerla 365 días; la política legal/operativa de producción queda por
revisar. No se incluye eliminación automática ni una herramienta para borrarla.

## Límites de producción y verificación

El adaptador de principal reutiliza la sesión comercial y no depende de Auth0 ni
Supabase dentro de Control. La sesión actual **no contiene evidencia MFA verificable**:
se bloquean todas las escrituras sensibles fuera de desarrollo local confiable.
No existe un header o rol de React que omita esta restricción. Antes de producción
faltan evidencia MFA verificada en el contrato de identidad, procedimiento operativo
de bootstrap, revisión de retención y validación del origen administrativo separado.
`CONTROL_WEB_ORIGIN` permite declarar un origen exacto distinto y
`VITE_CONTROL_API_BASE_URL` la URL de API para ese despliegue futuro; cookies,
sesiones y callbacks requieren coordinación con la responsable de autenticación.
Estas variables no habilitan por sí solas un despliegue entre dominios.

```powershell
pnpm verify
pnpm dev:status
pnpm health
pnpm dev:stop
```

Las pruebas de Control usan fixtures identificadas `CONTROL TEST` exclusivamente
en `beauty_wellness_test`/`bw_test`, con limpieza por identificadores propios, sin
resets, eliminación de volúmenes ni privilegios para cuentas reales.

## M1.6.7 · Planes y accesos gratuitos

En `/control/usuarios`, busca el correo **verificado**, abre la cuenta y confirma
su correo e identificador. Un `PLATFORM_OWNER` o `PLATFORM_ADMIN` con autorización
para operaciones sensibles puede elegir **Conceder acceso gratuito**. También está
disponible en el detalle de `/control/solicitudes`. No requiere aprobar la solicitud,
seleccionar antes un plan de interés ni tener ya un establecimiento.

Elige Start, Grow, Scale o Enterprise; modalidad Prueba, Piloto o Cortesía; vencimiento
explícito y motivo. Confirma el identificador y el plan. El inicio lo fija el servidor
al guardar. Enterprise exige límites positivos de sucursales, profesionales y usuarios,
y registra cuotas futuras de WhatsApp/IA sin simular consumo. El formulario sugiere
30 días. Prueba admite hasta 90 días, piloto 180 y cortesía 366; conceder o extender
más de 90 días exige el propietario de plataforma. No hay autoactivación de la cuenta
del operador, permisos por correo ni concesiones para identidades sin verificar.

El cliente recarga `/activacion`, ve el plan gratuito y su vigencia y elige
**Configurar mi negocio** para entrar a `/onboarding`. Después de completar la
configuración puede entrar al negocio mediante su membresía existente. No necesita
tarjeta, checkout ni otra elección de plan. Los límites se comprueban también en
las escrituras normales de Staff y en la finalización del onboarding.

**Gestionar acceso gratuito** permite extender, suspender, reactivar una suspensión
vigente o finalizar. Un acceso vencido puede extenderse explícitamente; un registro
finalizado no se reactiva. Consulta la fecha, modalidad e historial en el detalle
de la solicitud o en `/control/auditoria`. Las escrituras usan versión, idempotencia,
confirmación, motivo y auditoría transaccional. Una relación comercial pagada existente
no se sustituye por una concesión gratuita. Suspender o vencer conserva el negocio.

API: `POST /api/control/users/:id/free-access` concede; `PUT` sobre la misma ruta
extiende o cambia el estado. La búsqueda de `/api/control/users?q=...` admite prefijo
de correo verificado. Los identificadores proceden de la cuenta registrada, no de
un correo enviado como autorización desde React.

Billing se pospuso: no hay módulo de pasarela, ruta `/contratar`, checkout ni webhook
de pagos en el código activo. La migración ya aplicada `20261031000200_noma_billing`
se conserva intacta, con sus tablas preparatorias inactivas, para no reescribir el
historial de PostgreSQL. No habilita cobros ni registra pagos o ingresos.

Validación desde PowerShell: `pnpm verify`, `pnpm dev:local`, `pnpm health`.
Las pruebas adicionales están en `free-access.integration.spec.ts` y usan solamente
la base de pruebas. Detén únicamente tu propia instancia con `pnpm dev:stop`.

## M1.7 · Agenda y reservas Beauty

Con una membresía operativa y un acceso vigente, abre `/app/agenda` (también es el
destino de `/app`). En **Servicios** indica si cada servicio se presta con un
profesional o solo mediante espacio/equipo. Los servicios existentes conservan la
modalidad profesional. En **Equipo** configura sucursal, asociaciones, horarios y,
cuando corresponda, espacios/equipos y las unidades que usa cada servicio.

**Nueva cita** conserva la sucursal, profesional y fecha de la agenda. Elige servicio,
consulta horas, selecciona cliente o créalo en el mismo panel y registra teléfono,
presencial o interno. El correo del cliente es opcional; no necesita una cuenta Noma.
No se fusionan clientes por nombre/teléfono. Se normalizan espacios, guiones y
paréntesis del teléfono; no se adivina su país. La API devuelve posibles duplicados
en el alta independiente para revisión humana.

La agenda ofrece día/semana, filtros, paginación, actualización explícita y detalle
contextual. En móvil la semana permite escoger un día. Las filas muestran inicio,
fin y duración reales; no representan una escala de tiempo ficticia. No hay polling
ni se anuncia información en vivo. La búsqueda de clientes muestra hasta 30
coincidencias; afina por nombre o teléfono cuando sea necesario.

Crear deja la cita **por confirmar**. Puede confirmarse o cancelarse; una confirmada
puede completarse al terminar o marcarse como no asistida al comenzar. Cancelar
requiere motivo y libera capacidad. Reagendar exige motivo, conserva ID, cliente,
canal, duración y precio original; cambia sucursal/profesional solo con asociaciones
y horarios válidos. Una operación fallida conserva la reserva y sus asignaciones.
Los estados completada/cancelada/no asistió son terminales. Para conservar historia,
los servicios/profesionales con citas se desactivan en lugar de eliminarse.

### Contrato privado

Todas las rutas dependen de identidad, membresía y autorización comercial vigentes;
solo BEAUTY tiene esta capacidad implementada. El tenant procede de la sesión.

| Ruta bajo `/api/appointments` | Operación                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `GET /configuration`          | Servicios, sucursales y profesionales activos                                           |
| `GET /availability`           | `branchId`, `serviceId`, `date`, profesional opcional, `step`, `excludeId` al reagendar |
| `GET /agenda`                 | Fecha local, `days=1\|7`, filtros opcionales y página                                   |
| `GET /:id`                    | Detalle, historial y hora del servidor                                                  |
| `POST /`                      | Reserva con `requestId`, referencias, `startsAt` UTC y cliente nuevo o existente        |
| `PATCH /:id/reschedule`       | Nuevo intervalo, versión y motivo                                                       |
| `PATCH /:id/state`            | Estado, versión y motivo de cancelación                                                 |
| `GET /customers`              | Búsqueda `q` y página; 30 por página                                                    |
| `POST /customers`             | Alta independiente con `requestId` y `customer`                                         |

Las escrituras requieren UUID de idempotencia. Un reintento idéntico devuelve el
resultado original; reutilizar la clave con otros datos devuelve 409. Agenda:
200 citas por página; disponibilidad: un día y hasta 2000 opciones; configuración:
hasta 100 sucursales y 1000 servicios/profesionales. Horizonte técnico de nuevas
reservas: 366 días; duración máxima del motor: siete días. No es una cuota comercial
de reservas ni un cobro. La granularidad de inicio (5/10/15/20/30/60 minutos) no cambia
la duración del servicio. La API de creación revalida el instante, aunque haya sido
consultado segundos antes.

### Transacciones, capacidad y zonas horarias

`AppointmentsModule` concentra disponibilidad, asignación, estados, clientes y
auditoría operativa (`AppointmentEvent`, separada de `PlatformAudit`). Las escrituras
usan una transacción Read Committed con bloqueos compartidos de configuración y
bloqueos advisory exclusivos por profesional/recurso en orden estable. Coordinan
instancias distintas de NestJS. Las operaciones de configuración existentes usan
el bloqueo exclusivo del tenant. La idempotencia se persiste con la operación.

PostgreSQL añade `btree_gist` y una exclusión `[inicio, fin)` por profesional/tenant,
incluso entre sucursales. Para recursos de varias unidades se calcula el pico real
de ocupación bajo el bloqueo del recurso; no se suman citas consecutivas como si se
solaparan. Recursos/profesionales independientes pueden operar simultáneamente.
Staff impide bajar capacidad por debajo de las citas futuras existentes.

Se guardan instantes UTC (`timestamptz`) y zona IANA de la sucursal como contexto.
Cada horario se interpreta en su propia zona configurada. Se recorren minutos
reales: las horas inexistentes no se ofrecen; las repetidas mantienen instantes
UTC distintos y su offset visible. La duración mide minutos transcurridos reales.
Los horarios siguen siendo tramos locales dentro de un día; `24:00` permite cerrar
ese día y continuar desde `00:00` del siguiente. Los tramos deben estar configurados
en ambos días. No se inventan horarios cuando falta configuración.

La migración aditiva `20261101000100_appointments` crea clientes, citas, asignaciones,
eventos e idempotencia y añade `ServiceOffering.bookingMode`. No modifica migraciones
históricas ni crea datos de ejemplo en desarrollo. No se integran pagos, canales
WhatsApp/online, IA ni notificaciones. Los códigos futuros de canal están reservados,
pero tanto DTO como PostgreSQL aceptan únicamente PHONE, IN_PERSON e INTERNAL.

```powershell
pnpm db:migrate
pnpm dev:local
# Abre http://localhost:5173/app/agenda con tu sesión autorizada
pnpm health
pnpm verify
```

Las pruebas de concurrencia están en `appointments.integration.spec.ts` y usan dos
instancias NestJS contra PostgreSQL de pruebas. Las de calendario civil/DST están
en `appointment-time.spec.ts`; las de UI en `appointments/Agenda.test.tsx`.
