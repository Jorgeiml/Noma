# M0.2 — Selección y validación del stack tecnológico

Fecha de consulta y revalidación: **26 de octubre de 2026, Ecuador**. Versión documental: 0.2 — corrección de compatibilidad y estados. Estado: **PROPUESTA — PENDIENTE DE APROBACIÓN FINAL**. No autoriza implementación ni contratación.

## 1. Propósito

Comparar sistemas completos para construir y mantener la V1 comercial con uno o dos desarrolladores. La candidata principal sigue siendo React con Vite y TypeScript, NestJS con TypeScript, Node24 LTS, PostgreSQL18, Prisma7 con SQL específico, pg-boss y outbox, SDK de modelos con herramientas autorizadas y monolito modular con API y trabajador separados. React/Vite, TypeScript, NestJS como backend principal, PostgreSQL, monolito modular y separación entre IA y reglas transaccionales quedan como recomendaciones aceptables sujetas a aprobación final. Las versiones exactas, el ensamblaje y las decisiones dependientes de pruebas, proveedores, contratos o preguntas P0 siguen provisionales; ninguna recomendación equivale a una decisión aprobada. La alternativa ASP.NET Core queda prácticamente empatada en la matriz previa, sin desplazar a la candidata principal en esta corrección.

Documentos relacionados: [PRD](../product/PRD.md), [preguntas de producto](../product/OPEN_QUESTIONS.md), [decisiones propuestas](STACK_DECISIONS.md) y [verificación y pruebas pendientes](STACK_VALIDATION.md). Los dos documentos M0.1 se leyeron íntegramente y no se modifican. Se toman como entrada sus 12 módulos, 71 requisitos y 19 flujos, sin reinterpretar preguntas pendientes como aprobaciones.

**Clasificación de evidencia:** V = verificado en documentación oficial; I = inferencia técnica; S = supuesto pendiente de validación. Las recomendaciones y puntuaciones son I, condicionadas por S; no son mediciones ni pruebas de rendimiento. Los enlaces S01–S46 y la revalidación RC-01–RC-08 del registro de validación identifican las fuentes consultadas; referencias adicionales se enlazan directamente.

## 2. Contexto y requisitos del PRD

| Módulo | Requisitos que influyen en tecnología | Implicación propuesta, no esquema físico |
| --- | --- | --- |
| MOD-01 — Recepcionista IA | FR-MOD01-001, 002, 005 y 006: contexto, herramientas, información autorizada y precio variable | Adaptador de modelos en backend, validación de herramientas y estado persistido fuera del proveedor |
| MOD-02 — Agenda | FR-MOD02-001 a 008; FL-12, FL-13, FL-16 y FL-17 | Una autoridad transaccional de capacidad para todos los canales; agenda manual independiente de IA y WhatsApp |
| MOD-03 — Personal y sucursales | FR-MOD03-002 a 005 | Disponibilidad conjunta por profesional, ubicación y recurso; sucursal no equivale a tenant |
| MOD-04 — Catálogo | FR-MOD04-002 y 006 a 008; FL-18 y FL-19 | Precio fijo, desde, rango o sujeto a valoración; cotización versionada y aceptación separada |
| MOD-05 — Pagos | FR-MOD05-001 a 006; RN-02, RN-14 y RN-33 | Dinero exacto, evidencia confiable, deduplicación y conciliación; pago tardío no compra capacidad ocupada |
| MOD-06 — CRM | FR-MOD06-001, 005 y 006 | Identidad local al negocio, búsqueda/alta manual, consentimiento y vínculos entre valoración, cita y dinero |
| MOD-07 — Automatizaciones | FR-MOD07-001 a 006 | Trabajos durables, condiciones revalidadas al ejecutar, cancelación lógica y trazabilidad |
| MOD-08 — Marketing | FR-MOD08-001 a 005; FL-14 | Programación, cuotas por tenant, bajas comprobadas antes de despachar y resultados reales del canal |
| MOD-09 — Fidelización | FR-MOD09-001 a 005 | Operaciones concurrentes de saldo, consumo y reversión sin duplicados |
| MOD-10 — Bandeja humana | FR-MOD10-001 a 005; FL-11 | Estado de control humano persistido, entrega observable y actualización del panel sin respuestas competidoras |
| MOD-11 — Analítica | FR-MOD11-001 a 006; MET-15 a MET-17 | Consultas relacionales, filtros autorizados, origen multicanal y series monetarias diferenciadas |
| MOD-12 — Administración SaaS | FR-MOD12-001 a 005 | Identidad de empleados, autorización propia, aislamiento, cobros SaaS distintos de cobros del negocio y soporte limitado |

RNF-01 a RNF-15 requieren seguridad, privacidad, recuperación, pruebas, observabilidad, mantenibilidad, accesibilidad y control de costos. Ningún framework demuestra por sí solo esos atributos. No se introduce un objetivo de disponibilidad, latencia, concurrencia ni volumen que no figure aprobado en el PRD.

## 3. Restricciones del equipo

Un ingeniero inicialmente, un segundo posteriormente y asistencia intensiva de Codex. No consta la experiencia previa en TypeScript, Python o C#: se trata como S, no como una ventaja demostrada de un lenguaje. Se priorizan límites claros de módulos, herramientas documentadas, pruebas reproducibles y pocas piezas operativas. No existe tope presupuestario; se compara costo total de operación y mantenimiento sin inventar cotizaciones.

Se propone un repositorio con frontend, backend y procesos trabajadores del mismo producto cuando se autorice su creación. Esto no impone compartir entidades de persistencia con la interfaz: contratos y validación de entradas deben revisarse. No se crean archivos de proyecto, configuración, API, modelos físicos, migraciones ni infraestructura en M0.2.

## 4. Criterios de evaluación

La matriz usa catorce criterios y suma 100 %. Los pesos dan prioridad a confiabilidad, transacciones y aislamiento porque una reserva duplicada, saldo incorrecto o acceso cruzado afecta clientes y dinero. Mantenimiento pesa más que novedades de framework por el tamaño del equipo. La facilidad con Codex se puntúa igual mientras no exista evidencia del proyecto que distinga alternativas.

Escala: 1 = desajuste importante; 2 = exige componentes o trabajo sustanciales; 3 = viable con carga adicional identificada; 4 = buen ajuste con trabajo convencional; 5 = ajuste especialmente directo al criterio. Una puntuación 5 no significa seguridad perfecta ni rendimiento probado. Se mantienen iguales las garantías de base de datos entre stacks que usan PostgreSQL.

## 5. Comparación de stacks completos

| Elemento | A — TypeScript modular | B — Python modular | C — .NET modular |
| --- | --- | --- | --- |
| Panel | React + Vite + TypeScript, SPA | Mismo panel | Mismo panel |
| Backend principal | NestJS sobre Node LTS | FastAPI + Python + servidor ASGI | ASP.NET Core sobre .NET LTS |
| Datos | PostgreSQL + Prisma + SQL específico | PostgreSQL + SQLAlchemy + Alembic + controlador PostgreSQL | PostgreSQL + EF Core + Npgsql + SQL específico |
| Asíncrono | pg-boss, trabajadores Node y outbox | Celery, broker Redis, trabajadores Python y outbox | Quartz.NET con persistencia PostgreSQL, trabajador .NET y outbox |
| Identidad de personal | OIDC administrado como opción inicial; autorización en backend | Igual | Igual |
| IA | SDK oficial TypeScript y orquestación explícita | SDK oficial Python y orquestación explícita | Cliente compatible con el proveedor elegido; paquete y versión pendientes de verificar |
| Canales y dinero | Adaptadores HTTP de WhatsApp y pago, sin proveedor de cobro aprobado | Igual | Igual |
| Operación | Frontend estático, proceso web y trabajador persistentes, PostgreSQL administrado, almacenamiento de objetos y observabilidad | Igual más broker Redis para esta variante | Igual, sin broker Redis obligatorio |
| Pruebas | Vitest en panel; Jest y utilidades de Nest en backend; Playwright e integración PostgreSQL | Vitest, pytest, pruebas ASGI y Playwright | Vitest, xUnit, pruebas de aplicación .NET y Playwright |
| Carga adicional | Encapsular acceso a SQL y disciplina del event loop | Dos lenguajes y broker; mayor ensamblaje de convenciones de dominios | Dos lenguajes y toolchain; validar persistencia del planificador y cliente IA |

Las tres alternativas pueden cumplir V1. Los adaptadores no aprobados son fronteras pendientes en todos los stacks, no funcionalidades omitidas. Para B, una cola Python respaldada por PostgreSQL podría reducir dependencias, pero no se presenta como verificada en esta evaluación; cambiaría su puntuación operativa y exige nueva comparación. Quartz es un planificador persistente, no se presume equivalente a una cola de eventos: requiere gestión de outbox y estado de operaciones. Next.js puede sustituir el frontend en cualquiera de los tres; se evalúa en sección 7 sin asociarlo obligatoriamente a NestJS.

## 6. Matriz ponderada

**Todas las puntuaciones son I; las marcadas con S dependen especialmente de supuestos del equipo o carga.** Fórmula: total sobre 5 = suma de peso porcentual × puntuación / 100; sobre 100 = total × 20.

| Criterio | Peso % y motivo | A | B | C | Justificación de las puntuaciones A / B / C |
| --- | --- | --- | --- | --- | --- |
| Adecuación funcional | 12: cobertura integral | 5 | 5 | 5 | Las tres cubren panel, negocio, HTTP y trabajos con sus componentes; no se exige lenguaje exclusivo para ningún módulo |
| Confiabilidad crítica | 12: dinero y capacidad | 4 | 4 | 4 | Todas necesitan validación, transacciones e idempotencia propias; ninguna obtiene garantía por framework |
| Seguridad y aislamiento | 10: daño entre negocios | 4 | 4 | 4 | OIDC, controles backend y RLS son viables en las tres; requieren pruebas equivalentes |
| Consistencia transaccional | 12: invariantes | 5 | 5 | 5 | PostgreSQL y acceso transaccional en las tres, con SQL explícito cuando corresponda |
| Desarrollo con Codex | 5: asistencia revisable | 4 | 4 | 4 | Ecosistemas documentados; no hay medición comparativa de productividad de Codex en este repositorio |
| Mantenimiento por equipo pequeño | 10: revisión y cambios | 4 | 3 | 3 | A puede reducir cambios de contexto y contratos de tipos; B/C añaden lenguaje y toolchain. S: experiencia neutral, no conocida |
| Pruebas automatizadas | 7: regresiones críticas | 4 | 4 | 4 | Herramientas unitarias, HTTP y DB disponibles en las tres; integración real pendiente |
| Madurez y soporte | 5: continuidad | 4 | 4 | 5 | A/B con ecosistemas mantenidos; C tiene política LTS conjunta de runtime, ASP.NET y EF documentada; no implica que sus librerías externas hereden ese soporte |
| Compatibilidad | 5: evitar combinaciones falsas | 4 | 4 | 4 | Existe ruta documental viable, pero todos tienen paquetes, drivers o adaptadores por probar; no se asigna 5 sin ejecución |
| Escala razonable | 4: crecimiento sin exceso | 4 | 4 | 4 | Procesos y trabajadores replicables; límites reales pendientes de carga representativa, S |
| Complejidad de despliegue | 4: operación inicial | 4 | 3 | 4 | A/C pueden operar sin broker adicional; B con Celery/Redis incorpora otro servicio persistente |
| Costos y dependencia | 5: costo total | 4 | 3 | 4 | A/C no añaden Redis en su variante; B sí. Plataformas y contratos comunes pendientes, S; no se demuestra una factura inferior |
| Observabilidad y recuperación | 5: fallos visibles | 4 | 4 | 4 | Trazas, logs y restauración posibles; ninguno evita diseñar conciliación y ejercicios de recuperación |
| Extensibilidad | 4: doce dominios | 4 | 4 | 4 | Las tres permiten límites modulares y nuevos casos sin microservicios obligatorios |
| **Total** | **100** | **4,24 / 84,8** | **4,05 / 81,0** | **4,19 / 83,8** | Cálculo aritmético revisado; no benchmark |

### Sensibilidad e incertidumbre

La ventaja A–C es **0,05 sobre 5**, insuficiente para afirmar superioridad demostrada. Reasignar cinco puntos de peso desde mantenimiento hacia madurez deja A en 4,24 y C en 4,29: gana C. Si la experiencia real permite puntuar mantenimiento de C como 4 en lugar de 3, C sube a 4,29. Si B alcanza mantenimiento 4 y se valida una cola PostgreSQL que permita subir despliegue y costo a 4, B llega a 4,24, empate con A. No se modifica la matriz para ocultar estas alternativas.

Se propone A como opción de desempate por menor diversidad inicial de lenguaje y una cola PostgreSQL documentada, sujeto a validación del equipo y compatibilidad. Si el ingeniero domina .NET, se preferiría C antes que pagar aprendizaje para conservar A. Si domina Python y ya opera trabajadores fiables, B gana atractivo. Los tres conservan la misma obligación de integridad; no se invoca «TypeScript compartido» como garantía suficiente para elegir NestJS.

## 7. Frontend

| Aspecto | Next.js + TypeScript | React + Vite + TypeScript |
| --- | --- | --- |
| Panel, agenda, CRM, tablas, formularios y reportes | React cliente cubre interacción; servidor no sustituye lógica visual | React cliente cubre interacción y no exige runtime de renderizado en producción |
| Renderizado | SSR, generación estática y componentes de servidor útiles si hay contenido público o composición de servidor demostrada | SPA suficiente para áreas autenticadas; contenido inicial depende de carga del cliente |
| Autenticación | Puede integrar una capa de sesión del lado servidor | Puede usar sesión con backend independiente; no almacenar secretos en frontend |
| Actualización de agenda y bandeja | Necesita invalidación/suscripción y reconexión; SSR no entrega disponibilidad infalible | También necesita actualización y reconexión; validación final siempre en backend |
| Separación | Riesgo de duplicar negocio entre acciones de servidor y backend si no se delimita | Frontera cliente/backend explícita; contratos y manejo de sesión deben diseñarse |
| Despliegue | Puede requerir runtime Next y entender cachés y límites de plataforma | Artefactos estáticos en CDN y backend persistente independiente |
| Pruebas y mantenimiento | Probar límites servidor/cliente y caché además de UI | Probar navegación SPA, estado remoto y accesibilidad; faltan convenciones que el equipo debe acordar |

**I — recomendación:** SPA con React y Vite para el panel. La V1 no exige indexación ni SSR en todas las pantallas. Para una futura superficie pública que realmente requiera renderizado de servidor, revisar Next sin mover al frontend las reglas de reserva o pago. Next no se descarta por incapacidad ni por su relación con Vercel.

**V:** React publica documentación 19.3; Vite 8 tiene publicación estable y pide Node 20.19+ o 22.12+; Next muestra 16.4.3 y mínimo Node 20.9. Se propone Node 24 LTS, no esos mínimos históricos cuando estén fuera de soporte. Fuentes: [React](https://react.dev/versions), [Vite](https://vite.dev/blog/announcing-vite8), [Next](https://nextjs.org/docs/app/getting-started/installation). Compatibilidad de biblioteca concreta de agenda, tablas y formularios con React 19.3 y su accesibilidad sigue sin comprobar; no se selecciona una licencia o componente comercial sin revisión.

## 8. Backend y lenguaje principal

| Aspecto | NestJS + TypeScript | FastAPI + Python | ASP.NET Core + C# |
| --- | --- | --- | --- |
| Modularidad y dominios | Módulos e inyección favorecen convenciones explícitas | Routers y dependencias; límites de dominio necesitan convenciones propias | Inyección y composición de aplicaciones con límites de dominio explícitos |
| Transacciones y dinero | Prisma/SQL; tipos de ejecución y decimales deben controlarse | SQLAlchemy/SQL y decimales; no compartir sesión de DB entre trabajos concurrentes | EF/Npgsql y decimales; transacciones y reintentos deben coordinarse |
| APIs, webhooks y validación | Ecosistema HTTP; conservar cuerpo original para verificar evidencia cuando se requiera | Validación mediante modelos y dependencias; servidor ASGI y procesamiento durable separados | Validación y seguridad del ecosistema .NET; persistir entrada antes de trabajo posterior |
| Seguridad | Guardas no reemplazan autorización por objeto | Dependencias de seguridad no reemplazan autorización por objeto | Políticas no reemplazan contexto de tenant ni autorización por objeto |
| Concurrencia | E/S asíncrona; no bloquear event loop con trabajo intensivo | E/S asíncrona; llamadas bloqueantes no deben bloquear servidor | E/S asíncrona y ejecución paralela; no elimina conflictos de DB |
| Asíncrono durable | pg-boss o BullMQ con trabajadores | Celery y broker; tareas en memoria del servidor no bastan | Servicio trabajador con planificador persistente u otra cola |
| IA y observabilidad | SDK TypeScript, trazas y métricas | SDK Python y amplio ecosistema; no obliga a usarlo | Cliente HTTP/SDK y ecosistema .NET; verificar funciones concretas del proveedor |
| Testing y operación | Pruebas de módulos, HTTP, DB y trabajadores; un runtime principal | pytest, pruebas HTTP, DB y trabajadores; broker y runtime adicionales al panel | xUnit, pruebas de host, DB y trabajadores; toolchain distinta del panel |

**I:** NestJS como backend principal por estructura modular y ruta coherente de operación asíncrona, con un lenguaje de aplicación predominante. No es intrínsecamente más seguro ni más transaccional que las alternativas. Un único backend puede servir los doce módulos y llamar modelos por red. **No se necesita backend secundario Python**: considerarlo solo si aparece una dependencia de procesamiento Python no reemplazable y se demuestra el costo de aislarla.

**V y límite, revalidado:** el [enlace oficial de última release](https://github.com/nestjs/nest/releases/latest) redirige a **v11.2.8** y el [paquete core etiquetado](https://raw.githubusercontent.com/nestjs/nest/v11.2.8/packages/core/package.json) exige Node>=20 y paquetes Nest relacionados de major11. Se mantiene **NestJS11.2.8 con Node24 LTS** como referencia candidata, sin extender ese rango de core a todos los plugins o al CLI. La guía general describe12; esa discrepancia no prueba que11 sea incompatible con24 ni acredita una release12 estable. Tampoco se afirma que11.2.8 tenga soporte LTS o esté libre de incidencias. Antes de implementar se revalidarán mantenimiento, parches y dependencias. No se ejecuta CLI ni se toma su `latest` como selección aprobada.

## 9. Base de datos

**I — recomendación:** PostgreSQL administrado, rama estable soportada 18; parche 18.6 observado, sujeto al parche seguro ofrecido por el servicio al contratar. La página oficial señala 19 como RC y la tabla de soporte mantiene 18; no se adopta 19 RC. [Versionado oficial](https://www.postgresql.org/support/versioning/).

**V:** PostgreSQL documenta transacciones, niveles de aislamiento, bloqueos, rangos y exclusiones, y políticas de seguridad por fila. **I:** encajan con relaciones del producto, capacidad temporal, saldos, auditoría, filtros e índices para agenda/CRM. El diseño físico se deja para después.

| Responsabilidad | Garantía o validación necesaria |
| --- | --- |
| Base de datos | Atomicidad de cambios relacionados; unicidad/deduplicación; relaciones válidas; restricciones aplicables; aislamiento y bloqueos que respalden invariantes bajo concurrencia |
| Backend | Políticas, permisos, cálculo de disponibilidad y preparación, asignación de recursos, moneda y redondeo autorizados, aceptación de cotización y evidencia de pago; manejar conflictos y reintentar transacciones completas cuando corresponda |
| Ambos | Reservar y consumir beneficios de forma coherente; vincular correcciones, no sobrescribir dinero ni aceptación; auditoría y contexto de tenant |
| Proveedor externo | Evidencia de ejecución externa; una transacción local no hace atómico un cobro remoto ni su devolución |

No basta «consultar disponible y luego insertar». Se evaluarán restricciones de no solapamiento para recursos exclusivos y coordinación transaccional/bloqueos para capacidad mayor a uno, combinaciones y traslados. Una exclusión temporal por sí sola no resuelve recursos con capacidad N ni todas las políticas de OQ-AGE-01. Se deben tratar expiración de retención y pago concurrente como transición competidora, con una única resolución válida. Serializable puede abortar transacciones: el backend necesita reintentos acotados y devolución de conflicto comprensible. No se mantiene una transacción abierta mientras el cliente paga o el LLM responde.

Dinero con representación decimal exacta o unidad menor acordada, nunca aritmética binaria de coma flotante como autoridad financiera. Precio sin confirmar es ausencia explícita de total, no cero. Orientativo, confirmado, aceptación y movimientos verificados conservan semánticas distintas; pagos parciales se aplican una vez y no cambian retrospectivamente la cotización. Para analítica inicial se proponen consultas e índices PostgreSQL; vistas o agregados posteriores según planes de ejecución, sin agregar un almacén analítico por anticipado.

MySQL/MariaDB y SQL Server son relacionales viables. No se identifica un requisito que compense abandonar PostgreSQL; SQL Server sería reconsiderable con experiencia o servicios existentes del equipo. No se afirma que esos motores carezcan de transacciones o puedan evitar menos fallos. No se necesita una base documental, vectorial o distribuida para este PRD.

## 10. ORM y acceso a datos

| Opción | Fortalezas relevantes | Límites y trabajo necesario |
| --- | --- | --- |
| Prisma 7 + SQL explícito | Cliente tipado, transacciones y flujo de migraciones conocido; documentación versionada para PostgreSQL 18 | No representa todas las funciones de PostgreSQL; revisar SQL para restricciones, RLS y consultas complejas; no confiar en filtros automáticos como aislamiento suficiente |
| Drizzle 0.45.4 + SQL | Cercanía a SQL y tipos TypeScript; menor distancia de consultas especializadas | Requiere disciplina de migraciones y aislamiento igualmente; 1.0 RC no se adopta como base obligatoria |
| SQLAlchemy + Alembic | Alternativa natural de B, transacciones y SQL expresivo | Sesión por unidad de trabajo; validar integración asíncrona y versiones con Python elegido |
| EF Core 10 + Npgsql 10 | Alternativa de C con LINQ, migraciones y acceso SQL cuando se necesita | Alinear proveedor y EF; filtros de consulta no son barrera suficiente; validar semántica de SQL y reintentos |
| Solo SQL + driver | Máximo control de funciones PostgreSQL | Mayor trabajo de contratos, mapeo y convenciones para todo el CRM; razonable en operaciones críticas, menos cómodo como única abstracción de doce módulos |

**I:** Prisma **7.10.1**, no Prisma 8 RC, para acceso ordinario; SQL parametrizado revisado para operaciones que lo necesiten, dentro de límites transaccionales explícitos. Drizzle queda como sustituto si la prueba de acceso revela fricción sustancial y sostenida con requisitos PostgreSQL, no como segundo ORM simultáneo. Nunca concatenar entrada del cliente o del modelo como SQL.

**V:** Prisma 7 documenta Node ^20.19, ^22.12 o ^24 y TypeScript >=5.4, soporte de PostgreSQL 18 y transacciones interactivas. Se recomienda un único estilo de módulos ESM a validar con Nest y pruebas. La documentación sin prefijo puede redirigir a material de Prisma 8 mientras releases lo identifica como RC; se usan páginas `/v7/`. No se promete que Prisma evite reservas duplicadas o conserve RLS sin un contexto de conexión correcto.

**Corrección del ensamblaje:** para la ruta candidata de conexión directa a PostgreSQL, Prisma7 necesita el adaptador `@prisma/adapter-pg` y su controlador compatible; cliente, CLI y adaptador deben mantener una combinación7 explícitamente revisada. No se introduce Prisma Accelerate como requisito. La [receta oficial de Nest](https://docs.nestjs.com/recipes/prisma) confirma el uso de adaptador, pero sus ejemplos y defaults actuales no certifican una aplicación Nest11 ya ensamblada. Se verificará ciclo de vida del pool, cierre, TLS y presupuesto conjunto de conexiones con pg-boss.

ESM sigue como **preferencia provisional**, no como requisito de Prisma que obligue a migrar todo Nest: el [generador de Prisma7](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators) permite formato ESM o CommonJS. Cliente generado, salida del compilador, extensiones de importación, servidor, trabajador y runner deben acordarlo explícitamente; no basta que frontend use ESM o que TypeScript acepte un import. Si se conserva CommonJS en backend se debe validar su interacción con pg-boss12 ESM. Se decidirá la ruta coherente mediante pruebas futuras, sin generar configuración ahora.

## 11. Autenticación y autorización

| Alternativa | Beneficios | Costos, límites y riesgos |
| --- | --- | --- |
| OIDC administrado, Auth0 como candidato | Proveedor gestiona identidad, login y recuperación; soporte de organizaciones documentado | Funciones y costos dependen de plan, usuarios y organizaciones; contratos y residencia pendientes; dependencia del proveedor |
| OIDC autogestionado, Keycloak como candidato | Estándares y control operativo; alternativa de salida del proveedor | Operar identidad, actualizaciones, backups, correo, claves y disponibilidad; carga relevante para un ingeniero |
| Identidad integrada, por ejemplo Auth de Supabase o ASP.NET Core Identity en C | Puede reducir piezas en un stack ya adoptado | No elegir una plataforma de datos por asumir autorización automática; revisar necesidades, exportación y ciclo de vida antes de comprometerla |

**I:** preferir identidad administrada por OIDC para empleados y propietarios; **Auth0 es candidato provisional**, no compra aprobada. Organizaciones del proveedor pueden ayudar al login, pero tenant, membresías, capacidades, sucursales y soporte son autoridad del backend. Verificar issuer, audience, firma, caducidad y sesión; comprobar permisos vigentes también después del login. La revocación local debe impedir nuevas operaciones restringidas sin esperar indefinidamente al vencimiento de un token remoto.

Se proponen sesiones del panel gestionadas por backend, cookies protegidas y controles CSRF/CORS acordes al despliegue; no se consideran suficiente los flags de una cookie sin revisar orígenes y dominios. SPA estática y backend pueden usar dominios propios del mismo sitio; combinación concreta de redirección OIDC, cookies, callback y recuperación requiere prueba. Una caída del proveedor de identidad puede afectar login: independencia de WhatsApp/IA no equivale a disponibilidad absoluta.

Cliente de WhatsApp se identifica por canal y relación comercial, con verificación adicional para acciones privadas o sensibles según OQ-SEC-03. No es una cuenta de empleado ni se exige OIDC o WhatsApp a quien reserva presencialmente. Soporte de plataforma requiere autorización acotada, motivo, duración, revocación y auditoría; un superadministrador técnico no es permiso comercial universal.

## 12. Multitenancy

| Estrategia | Seguridad y consultas | Migraciones, backups y operación | Equipo pequeño, costo y evolución |
| --- | --- | --- | --- |
| A: base compartida con tenant_id | Requiere contexto verificado, aislamiento por objeto y defensa adicional RLS; riesgo de filtro omitido | Un ciclo de migraciones; recuperación global sencilla, recuperación por tenant más difícil; nunca restaurar producción global por un caso individual sin plan | Menor número de bases; concentración de carga y daño potencial; permite evolución selectiva con preparación |
| B: schema por tenant | Separación de nombres no sustituye permisos; riesgo de selección de schema o contexto incorrecto | Muchas aplicaciones de migración; catálogo y consultas agregadas más complejos; restauración selectiva requiere planificación | Más operación; soporte multi-schema del ORM no significa ciclo de vida de tenants automático |
| C: base por tenant | Frontera de conexión más fuerte; credenciales y enrutamiento deben comprobarse | Migraciones, pools, backups y restauraciones multiplicados; aún hay que aislar archivos, mensajes y procesos | Más costo y mantenimiento; adecuada si contrato o aislamiento dedicado lo exige; no se descarta como evolución |

**I:** iniciar con base compartida, tenant_id lógico y **autorización backend más RLS como defensa adicional**, sujeto a OQ-PRO-02 y OQ-SEC-01. No se diseña ninguna tabla o política en esta entrega. La frontera funcional del tenant sigue pendiente: una sucursal no se transforma en tenant por conveniencia técnica.

Controles propuestos: derivar tenant de identidad y membresía validadas; no confiar en un parámetro del navegador, job o herramienta de IA; contexto de tenant limitado a unidad transaccional; no reutilizar estado de sesión entre conexiones de un pool; roles de aplicación sin superusuario, propiedad de tablas ni BYPASSRLS; separar identidad de migración y soporte; verificar relaciones, índices y errores para evitar referencias o fugas cruzadas. RLS no protege automáticamente almacenamiento de archivos, cachés, adjuntos, logs, reportes ni contexto del modelo. PostgreSQL documenta excepciones para propietarios y roles privilegiados: deben probarse y controlarse, no ocultarse bajo «RLS activado».

## 13. Jobs y eventos

| Alternativa | Adecuación | Costo y limitación |
| --- | --- | --- |
| pg-boss en A | Trabajos durables sobre PostgreSQL; encaja con Node sin broker inicial | Comparte capacidad y dominio de fallo con datos; gestionar pools, acumulación, retención y actualizaciones de su almacenamiento interno |
| BullMQ con Redis | Alternativa documentada para trabajadores Node y separación de carga | Redis agrega persistencia, recuperación y operación; locks/stalls no implican efecto externo exactamente una vez |
| Celery con Redis o RabbitMQ | Alternativa madura de B para colas y trabajadores Python | Broker adicional y semántica de ack/reintento; documentación señala que Windows no está soportado; validar entorno Linux/WSL posterior |
| Quartz.NET con PostgreSQL | Planificación persistente para C | Complementar con outbox, estados y procesadores; no tratar un disparo de reloj como evento de negocio |
| Cola administrada | SQS u otra equivalente puede reducir operación del broker y separar cargas | Contrato de entrega, orden, ventanas, dead letters y costo propios; adaptador y pruebas; no necesaria solo para sofisticación |

**I:** pg-boss **12.38.0** y trabajador persistente independiente del proceso web, compartiendo módulos y reglas del backend. **Redis no es requisito del primer lanzamiento.** Revisar BullMQ/cola administrada si mediciones muestran contención, necesidades de aislamiento de carga o capacidades no cubiertas. No usar temporizadores en memoria o tareas de una petición HTTP como única fuente de recordatorios y pagos.

**V, precisión de versión:** el [manifiesto etiquetado12.38.0](https://raw.githubusercontent.com/timgit/pg-boss/12.38.0/package.json) declara ESM, Node>=22.12, dependencia `pg` y peer `@opentelemetry/api` ^1.9.0. Node24.22.1 satisface ese requisito de runtime. Incorporar una API de instrumentación requerida por el paquete no implica desplegar collector, exportadores o una plataforma APM; la selección operativa de observabilidad sigue provisional. Las dependencias de desarrollo de ese manifiesto no son un conjunto de producción aprobado para nuestro proyecto ni prueba de interoperabilidad con Prisma.

Evento de negocio = hecho registrado, como reserva confirmada. Trabajo = intento programable de ejecutar una acción. Mensaje externo = comunicación con un proveedor, con su propio estado. Estado persistido = autoridad que indica si la operación existe y si sigue siendo válida; no se deriva de que un job haya terminado.

Se propone outbox transaccional: registrar cambio de negocio y necesidad de procesamiento en la misma transacción local; un despachador entrega a pg-boss y confirma avance. Si negocio y cola usan conexiones distintas, **no** asumir atomicidad por estar en el mismo servidor PostgreSQL. Repetir publicación o ejecución debe ser seguro por identidad de operación y validación del estado; un fallo entre publicar y marcar puede repetir entrega.

Se diseña para **al menos una entrega/intento**, no ejecución externa exactamente una vez. Ante timeout de cobro o envío no conocido, consultar o conciliar antes de repetir efecto irreversible; usar idempotencia del proveedor cuando esté documentada. Retentar con demora acotada y registrar fallos para revisión, sin fijar límites arbitrarios. Revalidar consentimiento, baja, control humano, vigencia de cita y versión de cotización antes del despacho. Campañas tendrán control de consumo por tenant y prioridad respecto de acciones operativas; una cola saturada no debe bloquear reserva manual. Procesos prolongados conservan estado y pasos recuperables sin mantener transacción abierta.

## 14. Inteligencia artificial

| Enfoque | Beneficio | Riesgo y decisión |
| --- | --- | --- |
| SDK de proveedor + herramientas y orquestación explícita | Menos capas, control sobre llamadas, errores y estado | Más trabajo propio de recuperación y evaluaciones; propuesto inicialmente |
| LangGraph TypeScript o Python | Grafos de estado, persistencia, interrupción y reanudación de recorridos complejos documentados | Checkpoints y herramientas aún requieren idempotencia; dependencia y curva de mantenimiento. Reconsiderar si la complejidad real lo justifica |
| AI SDK u otra abstracción madura | Interfaz para distintos proveedores y herramientas | Semánticas no idénticas entre proveedores; puede ocultar restricciones. No añadirlo además de otro orquestador sin beneficio concreto |

Se distinguen modelo de lenguaje (infiere texto/intención), orquestador (coordina pasos), herramientas (entradas controladas a capacidades), reglas del backend (autorizan), base de datos (persiste y protege invariantes) y motor de automatización (ejecuta reglas y trabajos). La agenda y el panel no dependen de generar texto. No se da conexión directa a SQL al modelo ni herramientas para cambiar políticas o confirmar precios sin actor facultado.

**I:** adaptador de proveedor, SDK oficial TypeScript y herramientas limitadas para consultar catálogo, modalidades de precio, disponibilidad y cotizaciones autorizadas; proponer reserva a la misma lógica transaccional que usa el panel. Validar argumentos, tenant, permisos, precondiciones y resultado. Salidas estructuradas reducen errores de forma, no demuestran verdad comercial. Manejar rechazo del modelo, argumentos inválidos, fuentes ausentes, timeouts y cambio de control humano entre generación y despacho.

Contexto pertinente y versión de prompt se registran con minimización y aislamiento; historial comercial y checkpoints relevantes quedan bajo control del producto. No se almacenan prompts completos indiscriminadamente en trazas. Evaluar conversaciones en español del segmento con precios desde/rango, valoración, solicitudes ambiguas, cambio de cita, manipulación de instrucciones y transferencia humana. Selección del modelo por cumplimiento, latencia, costo de tareas representativas y política de datos, **sin modelo concreto aprobado** ni elección por clasificación general de benchmarks. Medir tokens de entrada, salida, contexto y reintentos por tenant; reducir contexto y derivar cuando corresponda, sin afectar capacidad manual.

| Acceso a modelos | Diferencias relevantes | Recomendación provisional |
| --- | --- | --- |
| OpenAI directo | API y SDK oficiales, controles de datos y catálogo propios; límites y disponibilidad según cuenta y modelo | Candidato inicial para una prueba posterior sin compromiso de compra ni residencia supuesta |
| Azure OpenAI | Recursos, despliegues, identidad y disponibilidad regional del entorno Azure; la compatibilidad depende de función y modelo | Preferible si requisitos de gobierno, región o servicios existentes lo justifican; no asumir paridad inmediata con OpenAI ni precio inferior |

La documentación Microsoft consultada explica diferencias de endpoint y uso del nombre de despliegue; OpenAI documenta herramientas, esquemas y controles de datos. No se afirma retención cero universal ni disponibilidad de un modelo en Ecuador o una región sin revisión. Proveedor y contrato dependen de OQ-SEC-01 y OQ-ARC-02; comparar costo total por tarea, no solo precio por token.

## 15. WhatsApp

| Opción | Beneficios | Responsabilidades y riesgos |
| --- | --- | --- |
| Cloud API directa | Menos capa de intermediación, control del adaptador y relación técnica directa | Incorporación multiempresa, verificación/aprobaciones, números, permisos, plantillas, credenciales, webhook y soporte quedan a cargo del producto; no elimina tarifas de Meta |
| Proveedor autorizado | Puede facilitar incorporación, soporte y capacidades operativas, según contrato | Cargos y dependencia adicionales; verificar estado de proveedor, portabilidad de números, exportación de historial y límites, sin suponerlos |

**I:** Cloud API directa como opción técnica provisional, condicionada a factibilidad de incorporación de múltiples negocios, propiedad/administración de números, uso de Business App existente y soporte. Si el acceso o la carga operativa no es adecuada para un ingeniero, un proveedor autorizado puede ser la mejor elección. No se decide proveedor comercial ni se registra cuenta.

Persistir entrada validada antes de procesamiento posterior; correlacionar negocio y número por configuración confiable; verificar autenticidad del webhook con el mecanismo vigente documentado y deduplicar notificaciones. Separar envío, aceptación, entrega, lectura y fallo. No usar estado de mensaje como confirmación de reserva o pago. Respuesta manual pasa por el mismo adaptador y reglas de elegibilidad; control humano se revalida antes de enviar texto generado.

**V parcial:** la página oficial de precios describe categorías marketing, utility, authentication y service, y cobro por mensaje entregado según mercado/categoría. **No se fija tarifa de Ecuador ni se garantiza gratuidad**: las páginas técnicas intentadas devolvieron 429 o acceso restringido, y el contenido público general no demuestra condiciones completas de la cuenta. Ventanas, plantillas, consentimiento, promociones, límites y condiciones de cada categoría deben revalidarse antes de activar. La aprobación de plantilla no sustituye consentimiento. Agenda y reservas manuales siguen funcionando sin este adaptador; avisos no entregables quedan pendientes o suprimidos conforme al PRD.

## 16. Pagos

| Necesidad | PayPhone, evidencia consultada | Kushki, evidencia consultada |
| --- | --- | --- |
| Enlace de pago | API Link documenta importe e identificador de operación | Documentación de Ecuador y Smartlinks con notificaciones |
| Confirmación | Botón documenta consulta/confirmación y reverso; el mecanismo exacto cambia por producto | Smartlinks documenta aprobada y rechazada; verificar autenticidad y consulta contra operación |
| Webhook | Notificación Externa requiere autorización previa; no basta una cuenta creada | Documenta eventos y referencia a encabezados; mecanismo íntegro de seguridad no quedó comprobado aquí |
| Reverso/devolución | Se documentan reversos; límites, parciales, plazos y conciliación contractual pendientes | Hay documentación por productos y país; cobertura exacta de devolución parcial y conciliación por contrato pendiente |
| Recurrencia | Catálogo menciona tokenización; esto no demuestra suscripciones automáticas disponibles | Portal general incluye recurrencia; habilitación para Ecuador, producto y comercio requiere confirmación específica |
| Comisiones | Portal publica tarifa general; no se adopta como tarifa contractual de esta plataforma | No se obtuvo una tarifa contractual aplicable verificable |

**I:** mantener un adaptador de cobro; realizar la primera evaluación de factibilidad con PayPhone por el enlace documentado y el contexto local, comparándola con Kushki antes de elegir. **Selección de proveedor pendiente de validación**, especialmente si notificación fiable, consultas de conciliación, devoluciones o modelo multiestablecimiento no se habilitan. La falta de evidencia no se transforma en afirmación de que una capacidad no existe.

Un anticipo o pago parcial es un cobro de importe conocido para un concepto, no una obligación de que la pasarela conozca el total final del tratamiento. Cobrar valoración de importe fijo con total posterior desconocido es compatible conceptualmente; no equivale a validar ese recorrido en sandbox. No calcular porcentajes sobre una orientación. Backend comprueba origen de evidencia, importe, moneda, comercio receptor, identificador y estado, deduplica y concilia; un redirect del navegador o captura de pantalla no acredita dinero. Si el proveedor requiere confirmación dentro de plazo, un proceso durable debe cumplirla sin depender de que el navegador regrese; validar el plazo para el producto elegido.

Para FL-12, persistir pago tardío como dinero recibido y revalidar capacidad, sin confirmar horario ocupado. Fallo después de cobro externo deja operación incierta para consulta/revisión, no un nuevo cargo automático. Cancelaciones y diferencias con cotización preservan movimientos originales. No almacenar datos de tarjeta en el producto: usar captura alojada/tokenización autorizada, revisando obligaciones que subsisten. Evitar asumir modelo de agregador de fondos: onboarding y liquidación por comercio y cobros propios del SaaS se validan por separado. Cobro recurrente del SaaS y membresías de clientes son decisiones distintas y no se heredan de «tokenización».

## 17. Infraestructura y despliegue

| Alternativa | Ajuste | Límites y costo operativo |
| --- | --- | --- |
| Vercel | Hosting del panel estático o Next, distribución y despliegues | Funciones tienen límites de ejecución; no alojar un bucle persistente de pg-boss como si fuera una petición sin límite |
| Render, contenedores/procesos administrados | Backend web persistente, trabajadores continuos y PostgreSQL administrado | Región, plan, conexiones, backups y SLA dependen de oferta; menos operación propia, dependencia de plataforma |
| Supabase | PostgreSQL, identidad, almacenamiento y funciones integradas pueden ser útiles | Usarlo no obliga a exponer DB a clientes ni resuelve autorización automáticamente; revisar rol privilegiado, RLS, pool y límites de funciones; no reemplaza por sí solo al trabajador persistente |
| AWS ECS/Fargate + RDS + S3 + servicios operativos | Control de red, procesos persistentes y opciones amplias de continuidad | Más decisiones de IAM, networking, despliegue, alertas y facturación; beneficios si requisitos concretos los justifican |

**I — ruta inicial provisional:** frontend estático en Vercel o servicio estático equivalente; backend y trabajador en Render, PostgreSQL administrado en la misma región; objetos privados en S3 o alternativa de objetos validada. No se propone Vercel más Supabase más AWS como requisito de acumulación: usar Supabase para datos sería una sustitución evaluada, y mover todos los procesos a AWS sería otra alternativa, no una segunda infraestructura paralela obligatoria. Puede concentrarse hosting estático en Render si simplifica dominios y costos. No se contrata nada en esta tarea.

**V:** Render documenta trabajadores continuos, PostgreSQL 18 disponible y recuperación temporal para bases pagadas; el parche exacto, permisos, extensiones y ventana adecuada al producto siguen por validar. Backups de base de datos no son backups de fotos, adjuntos ni configuración externa. Definir copias/exportación y recuperación de objetos, secretos y configuraciones, con pruebas de restauración aislada. La continuidad que exige OQ-ARC-02 puede justificar alta disponibilidad o cambiar proveedor; no se promete un SLA desde un nombre comercial.

Entornos development, staging y production separados en datos, credenciales y callbacks; no copiar datos personales reales a pruebas por defecto. Despliegues reproducibles con versiones fijadas cuando se autorice implementación, revisión de cambios y regreso a una versión segura; restaurar datos no es lo mismo que revertir código. Reservar permisos de cambio estructural a operación controlada y comprobar compatibilidad durante despliegues. Secretos solo en almacenes/variables protegidos del servicio, nunca en bundle frontend, logs o repositorio.

Región: seleccionar después de revisar tratamiento de datos y medir latencia desde Ecuador; no se presupone región ecuatoriana ni que la región geográficamente más próxima sea la mejor. Limitar conexiones y concurrencia por proceso para no agotar PostgreSQL al replicar trabajadores. Logs estructurados con correlación de operación, trazas OpenTelemetry en componentes estables verificados, métricas de errores, cola, pagos inciertos y uso por tenant. Alertas ante fallos accionables y procedimientos de atención; retención y exportador a decidir sin desplegar una suite completa por anticipado.

### Costos sin presupuesto artificial

Costo total a estimar posteriormente = frontend + proceso web + trabajadores + DB/almacenamiento/backup/transferencia + identidad + objetos + observabilidad + mensajes por categoría/mercado y proveedor + tokens por tipo/modelo y reintentos + transacciones de pago/devolución + tiempo de operación. Los cobros y comisiones del establecimiento se separan del consumo/cobro de la suscripción SaaS. Escenarios bajo, habitual y alto deben usar volúmenes aportados por negocios, no cantidades inventadas. No se calcula una factura actual sin tamaños, región, contrato y uso. Comparar también recuperación, soporte, migración y horas de mantenimiento; un plan gratuito sin continuidad suficiente no es criterio de lanzamiento comercial.

## 18. Testing y calidad

Propuesta de herramientas para evaluar con A: TypeScript con comprobación estática, Vitest y React Testing Library para panel, Jest con utilidades de Nest y pruebas HTTP para backend, Playwright para E2E, pruebas con PostgreSQL real para restricciones y concurrencia. Esta lista no afirma compatibilidad ejecutada: Jest y su transformador quedan provisionales hasta demostrar la ruta ESM/CommonJS y metadatos de decoradores del backend elegido. Evaluar Testcontainers o instancia efímera equivalente cuando se autorice disponer de runtime de contenedores; aquí no se instala ni configura. ESLint y Prettier para análisis y formato; auditoría de dependencias y secretos en revisiones futuras, sin atribuir seguridad completa a un escáner.

| Tipo | Escenarios y evidencia que debe producir |
| --- | --- |
| Unitarias | Políticas autorizadas, modalidades de precio, aceptación versionada, pagos parciales y saldos; reloj controlado para reglas temporales |
| Integración DB | Transacciones, SQL específico, RLS con roles reales, rollback y conexión reutilizada entre tenants; nunca SQLite como sustituto de garantías PostgreSQL |
| Concurrencia | FL-13 entre panel y canal digital, recursos compartidos y consumo simultáneo de una última sesión; resultado válido bajo carrera real con conexiones distintas |
| Contratos | Validar fixtures y esquemas de proveedores por producto; cuerpos originales y evidencia inválida, duplicada y fuera de orden; fixtures no sustituyen certificación del proveedor |
| Webhooks y dinero | FL-12 con pago fallido, tardío, duplicado, respuesta incierta y devolución reintentada; no mover dinero real |
| Trabajadores e idempotencia | Caída después de guardar, publicar, ejecutar o enviar; repetición no duplica efectos; job obsoleto se suprime y no restaura cita cancelada |
| Autorización | Identidad de negocio A intenta leer, cambiar, reportar, descargar o activar herramienta sobre B; alcance de sucursal y soporte revocado |
| E2E | FL-16/17 sin configurar WhatsApp ni IA, búsqueda/alta manual, conflicto, errores y falta de consentimiento; FL-18/19 gratuitas/pagadas y reserva posterior |
| Herramientas de IA | Argumentos inválidos, tenant manipulado, permisos insuficientes, fuente ausente y resultado fallido; nunca confirmar por texto del modelo |
| Conversaciones | Conjunto versionado en español con precio desde/rango, valoración, ataques de instrucciones y toma humana; evaluar exactitud comercial, derivación y consumo, no solo fluidez |
| Recuperación y operación | Restauración de backup, objetos, conciliación de eventos externos y trabajos pendientes; objetivos se acuerdan con OQ-ARC-02 |

Para reproducibilidad con Codex y CI: dependencias y runtimes fijados, datos sintéticos, fixtures sin secretos, reloj y zona temporal controlados, comandos de prueba documentados en etapa posterior, limpieza aislada y evidencias de fallo. No se han ejecutado estas pruebas. Compatibilidad de Jest, transformador de decoradores de Nest, ESM, Prisma generado y TypeScript se debe cerrar antes de aprobar el conjunto exacto; Vitest del frontend no demuestra esa compatibilidad backend.

## 19. Compatibilidad entre componentes

**Conclusión de esta revalidación:** no se confirmó una contradicción bloqueante en los rangos publicados de la candidata principal. Esto significa viabilidad documental condicionada, **no certificación de compatibilidad completa ni ausencia garantizada de incidencias**. Se corrigieron omisiones sobre adaptador, módulos y dependencias; la prueba integrada no se ha realizado. La matriz de selección y su aritmética permanecen sin cambios porque no surgió evidencia que justifique alterar sus puntuaciones.

| Cruce | Evidencia documental | Lo que sigue sin comprobar |
| --- | --- | --- |
| Node 24 LTS + Vite 8 | Cumple mínimo publicado de Vite | Plugins, librerías de agenda, navegadores y build real |
| Node 24.22.1 + Nest 11.2.8 | Cumple engines del paquete etiquetado | CLI 11, adaptador HTTP, decoradores, formato de módulos y pruebas del conjunto exacto |
| Node 24 + TypeScript5.9 + Prisma7 | Node24 incluido en requisitos de Prisma7; TS5.9 satisface mínimo5.4 | CLI/cliente/adaptador7, generación, controlador, pool, TLS y módulos con Nest/Jest; un mínimo no demuestra todas las versiones transitivas |
| Prisma 7 + PostgreSQL 18 | Motor 18 figura soportado | SQL específico, RLS, transacciones, restricciones e introspección sin perder elementos manuales |
| Node24 + pg-boss12.38.0 | Manifiesto de versión: Node>=22.12 y ESM; proyecto documenta PostgreSQL>=13 | Comportamiento bajo fallos con PG18, peer de instrumentación, permisos y pools; mínimo13 no convierte PG13 en opción soportada para producción |
| Prisma + outbox + pg-boss | Patrón local viable como I | No se comprobó una transacción compartida entre librerías; propuesta usa outbox y despachador idempotente |
| Nest11 + Prisma7 + pg-boss12 | Existen rutas de módulos configurables en cliente Prisma; pg-boss es ESM | Acordar módulos/imports, compilación, decoradores, inicialización y pruebas; no declarar interoperabilidad por sumar rangos de Node |
| SDK de modelos + herramientas autorizadas | Frontera de diseño aceptable; no se agregó una verificación nueva de proveedor/modelo en esta corrección | Paquete, versión, endpoint, modelo, tratamiento de datos y pruebas de herramientas; el SDK no ejecuta cambios críticos fuera de reglas backend |
| SPA estática + sesión/OIDC en backend | Ruta arquitectónica I compatible con separación | CORS, CSRF, cookies, dominios, callbacks y revocación con proveedor elegido |
| Render + web + trabajador + PostgreSQL | Capacidades documentadas | Extensiones, permisos de roles, región, conexiones y restauración del producto |
| .NET10 + EF10 + Npgsql10 | Publicaciones oficiales de familias compatibles | Quartz, cliente IA y ejecución integrada; no se hereda compatibilidad de todos los paquetes |
| FastAPI + Python + SQLAlchemy + Celery | Ruta documentada por proyectos individuales | Versiones transitivas exactas, broker, Linux y biblioteca de instrumentación; no afirmar compatibilidad por sumar mínimos |

No se mezclan funciones de Nest 12 con release 11 ni sintaxis de Prisma 8 con cliente 7. No se necesitan microservicios, Redis inicial, Python secundario, dos ORMs, dos proveedores de identidad ni dos orquestadores de IA. Web y trabajador son procesos del mismo backend modular, no servicios de negocio independientes con datos duplicados.

## 20. Stack recomendado

Todas las filas son propuestas o decisiones pendientes de validación; ninguna está aprobada. Versiones indican lo observado en fuentes, no instalación, lockfile ni compromiso de utilizar un parche obsoleto al comenzar.

**Estado de revisión registrado:** se consideran recomendaciones aceptables, sujetas a aprobación final, React/Vite, TypeScript, NestJS principal, PostgreSQL, monolito modular con API y trabajador separados, e IA separada de reglas transaccionales. «Aceptable» califica la dirección arquitectónica, no las versiones exactas ni la combinación ejecutable. Node24 LTS y PostgreSQL18 permanecen en la candidata, con sus parches y composición por validar. Prisma7+SQL, adaptador/controlador, pg-boss/outbox, módulos y runner, aislamiento definitivo, SDK/modelo y decisiones dependientes de P0 continúan provisionales. Autenticación, hosting, Meta y pasarela **no tienen proveedor definitivamente seleccionado**.

| Componente | Tecnología recomendada | Versión estable verificada, si se conoce | Motivo | Alternativa | Riesgo | Confianza | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Panel | React + Vite, SPA | React 19.3; Vite 8 estable, parche no fijado | Interacción administrativa sin SSR obligatorio | Next.js 16.4.3 | Plugins y agenda sin prueba integrada | Media | Recomendación aceptable — aprobación final y composición pendientes |
| Lenguaje | TypeScript | 5.9 documentada como base; 6.0 documentada como alternativa a evaluar | Tipado y convenciones comunes; no usar novedades para justificar cambios | C# o Python en backend | Compatibilidad de compilador y decoradores | Media | Recomendación aceptable — aprobación final y versión pendientes |
| Runtime | Node.js LTS | 24.22.1 observado como LTS | Cumple rangos documentados de componentes de A | Otra rama LTS soportada compatible | Parche y dependencias cambian | Alta | Candidato24 LTS — composición y aprobación pendientes |
| Backend | NestJS modular | 11.2.8 etiquetada estable; no se adopta guía 12 por defecto | Estructura de dominios y trabajadores | ASP.NET Core10; FastAPI | Mezclar guías/versiones y event loop bloqueado | Media | Recomendación aceptable — versión candidata y aprobación final pendientes |
| DB | PostgreSQL administrado | 18.6 en tabla oficial; rama18 candidata | Integridad, relaciones y capacidades de aislamiento | PostgreSQL17 soportado o SQL Server si hay causa | Configuración, carga y restauración | Alta | Recomendación aceptable — aprobación final, composición y proveedor pendientes |
| Acceso a datos | Prisma + SQL parametrizado específico + adaptador PostgreSQL | 7.10.1 como referencia; no8 RC; driver/adaptador por alinear | Productividad ordinaria más control PostgreSQL | Drizzle0.45.4 + SQL | Funciones no representadas, módulos y pool/RLS | Media | Provisional — pendiente de pruebas y aprobación |
| Trabajos | pg-boss + outbox y trabajador | 12.38.0; ESM y peer de instrumentación documentados | Durabilidad sin broker adicional inicial | BullMQ/Redis o cola administrada | Contención, reintentos y efectos externos inciertos | Media | Provisional — pendiente de pruebas y aprobación |
| Identidad personal | OIDC administrado; Auth0 candidato | Servicio administrado, versión no aplicable | Reducir carga de operar identidad | Keycloak o solución integrada evaluada | Plan, costos, región y dependencia | Media | Pendiente de validación |
| Autorización | Backend por capacidades + contexto tenant + RLS | Capacidades PostgreSQL18 verificadas | Control por operación y defensa adicional | Separación por DB si se exige | Omisión de contexto o roles privilegiados | Media | Provisional — depende de P0 y pruebas |
| IA | SDK oficial TypeScript, herramientas y orquestación explícita; OpenAI directo candidato | SDK sin parche verificado; modelo no seleccionado | Control de negocio y menor número de capas | Azure OpenAI; LangGraph si aparece necesidad | Datos, calidad, límites y costo | Media | Pendiente de validación |
| WhatsApp | Cloud API directa, adaptador aislado | Versión Graph y condiciones técnicas pendientes | Control de integración sin dependencia operativa para agenda | Proveedor autorizado | Incorporación multiempresa y políticas no verificadas íntegramente | Baja | Pendiente de validación |
| Cobros | Adaptador; PayPhone primer candidato de factibilidad, comparar Kushki | API/producto contractual sin versión final aprobada | Enlace documentado y validación local necesaria | Kushki u otro compatible validado | Notificación, conciliación, devoluciones y contrato | Baja | Pendiente de validación |
| Hosting | Estático Vercel o equivalente; web/trabajador Render | Servicios administrados, sin versión contractual fijada | Operación de procesos persistentes sin gestión de servidores | AWS Fargate/RDS; estático y DB alternativos | Región, plan, continuidad y costos pendientes | Media | Pendiente de validación |
| Objetos | S3 o servicio equivalente privado | Servicio, sin versión aplicable | Fotos/adjuntos separados del disco efímero | Almacenamiento Supabase evaluado | Acceso por tenant, respaldo y transferencia | Media | Pendiente de validación |
| Calidad | Vitest/Testing Library; Jest/Nest; Playwright; PostgreSQL real; ESLint/Prettier | Parches no verificados ni instalados | Cobertura de interacción e invariantes con herramientas distintas según capa | Herramientas equivalentes por stack | ESM, transformadores y dependencias por probar | Media | Pendiente de validación |
| Observabilidad | Logs estructurados y OpenTelemetry para señales estables | Paquetes/exportador sin versión fijada | Correlación y señales operativas sin atar negocio a APM | Servicio administrado compatible | Filtración de datos y costo de retención | Media | Pendiente de validación |

## 21. Justificación global

Se propone A porque conecta panel administrativo, dominios deterministas y trabajo durable sin backend Python ni broker inicial obligatorio; conserva PostgreSQL como autoridad de agenda y dinero; admite evolución de módulos sin desplegar doce servicios. La simplicidad operacional no elimina trabajo en permisos, transacciones, recuperación y UX.

Las cinco razones principales son separación clara de negocio y canales, encaje relacional/transaccional, menor diversidad inicial de lenguaje, trabajos PostgreSQL sin Redis obligatorio y pruebas del mismo recorrido para panel, IA y fallos externos. La alternativa C es igualmente defendible y su soporte LTS es ventaja real; la recomendación está condicionada al equipo y a pruebas de composición, no presentada como verdad absoluta de la matriz.

## 22. Riesgos y mitigaciones

| Riesgo principal | Mitigación y condición de revisión |
| --- | --- |
| Omisión de tenant o privilegio excesivo | Autorización por objeto, RLS con rol limitado, pruebas con pools y workers; revisar estrategia si contrato exige aislamiento dedicado |
| Carrera de capacidad, dinero o beneficio | Transacciones, restricciones pertinentes, coordinación concurrente, idempotencia y conciliación; demostrar FL-12/13 antes de usar dinero real |
| Documentación adelantada o combinación incompatible | Anclar fuentes por versión, excluir RC y fijar conjunto probado después; no usar `latest` para resolver una discrepancia |
| Canal/pago no habilitado o dependencia externa | Validar contratos, acceso, evidencia y recuperación; mantener agenda manual independiente y adaptadores sustituibles |
| Capacidad operativa/costos sin medidas | Cerrar RPO/RTO, región, consumo y carga; pruebas y alertas; separar trabajo y revisar proveedor o broker solo con evidencia |

Errores de modelo y manejo de datos se mitigan con fuentes autorizadas, herramientas restringidas, minimización, evaluaciones y control humano. No se promete eliminación completa de alucinaciones o de fallos.

## 23. Elementos postergables

Redis/BullMQ si pg-boss y PostgreSQL satisfacen carga; Kafka; Kubernetes; microservicios; Elasticsearch; base vectorial; almacén analítico independiente; LangGraph u otro motor de agentes si orquestación explícita basta; backend Python secundario; entrenamiento de modelo fundacional; SSR generalizado; proveedor adicional por mera redundancia nominal. Postergar estas tecnologías no posterga los doce módulos ni la recuperación, auditoría, consentimiento, trabajos durables o control humano requeridos.

## 24. Dependencias con decisiones abiertas

Las once preguntas P0 del registro original siguen PENDIENTES. Esta tabla especifica dependencia, recomendación provisional, información faltante, decisión humana y alternativa. OQ-ARC-01 recibe una propuesta, no se marca resuelta.

| P0 | Dependencia y recomendación provisional | Información y decisión humana necesarias | Alternativas preservadas |
| --- | --- | --- | --- |
| OQ-PRO-02 | Tenant compartido por negocio con sucursales como hipótesis; afecta autorización y datos | Aprobar frontera comercial, pertenencia múltiple y responsabilidades | Tenant por entidad independiente; DB dedicada si se exige |
| OQ-AGE-01 | PostgreSQL y coordinación transaccional de capacidad | Definir recursos N, preparación, secuencias y traslados antes de decidir restricción exacta | Distintos mecanismos de bloqueo/aislamiento sin cambiar motor por defecto |
| OQ-PAY-01 | Estado de reserva/pago separado, outbox y verificación | Política de retención, vencimiento, confirmación y resolución tardía | Retención configurada o solicitud sin retención con revalidación |
| OQ-PAY-04 | Importe conocido por concepto con total posiblemente desconocido | Autorizar reglas de anticipo por etapa y revisión de cotización | Cobro fijo de valoración, anticipo tras confirmar o sin anticipo |
| OQ-MKT-01 | Consentimiento y baja persistidos, revalidación antes de enviar | Definir evidencia, finalidades y clasificación de mensajes, con revisión vigente | Diferentes políticas permitidas por finalidad; bloquear promociones sin evidencia |
| OQ-SEC-01 | Proveedores y región no irrevocables; minimizar datos | Determinar finalidades, responsabilidades, transferencias, tratamiento y contratos aplicables | OpenAI/Azure, región/proveedor alternativo, separación adicional si corresponde |
| OQ-SEC-03 | OIDC administrado y autorización backend | Identidad de empleados y clientes, recuperación, facultades y acceso de soporte | Auth0, Keycloak o solución integrada; mecanismos de verificación por canal |
| OQ-INT-01 | Cloud API directa provisional y agenda desacoplada | Factibilidad de incorporación multiempresa, números, aprobación, condiciones y soporte | Proveedor autorizado o cambiar incorporación sin alterar agenda manual |
| OQ-INT-02 | Adaptador; PayPhone y Kushki en evaluación | Evidencia fiable, consulta, devoluciones, comisiones, comercio receptor y recurrencia autorizada | Otro proveedor validado; proveedores diferentes para negocio y SaaS |
| OQ-ARC-01 | A propuesto, C prácticamente empatado | Desarrollador decide stack tras revisar experiencia y validaciones pendientes | B y C completos siguen disponibles |
| OQ-ARC-02 | Web y trabajador persistentes, DB administrada y restauración probada | Aprobar objetivos de disponibilidad, pérdida tolerable, recuperación y contingencia | Mayor continuidad en proveedor inicial o infraestructura distinta |

P1 relevantes: OQ-COM-04 a 08, OQ-AGE-03, OQ-LOY-01 a 03, OQ-SEC-02, OQ-EXP-01/03/04/05, OQ-BIZ-01 a 03 y OQ-ARC-03 afectan políticas, volumen y pruebas. No cerrar esas preguntas aquí no justifica inventar valores o quitar funciones.

## 25. Fuentes verificadas

Las fuentes se consultaron el **26 de octubre de 2026**. El [catálogo de STACK_VALIDATION](STACK_VALIDATION.md#2-fuentes-oficiales-y-versiones) registra enlaces, hallazgos y límites por tecnología. Selección de fuentes primarias principales:

- Runtimes y frontend: [Node LTS](https://nodejs.org/en/about/previous-releases), [descarga Node](https://nodejs.org/en/download), [React](https://react.dev/versions), [Vite8](https://vite.dev/blog/announcing-vite8), [Next instalación](https://nextjs.org/docs/app/getting-started/installation).
- Backend y datos: [Nest releases](https://github.com/nestjs/nest/releases), [FastAPI notas](https://fastapi.tiangolo.com/release-notes/), [.NET soporte](https://dotnet.microsoft.com/en-us/platform/support/policy), [PostgreSQL soporte](https://www.postgresql.org/support/versioning/), [RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html), [aislamiento](https://www.postgresql.org/docs/18/transaction-iso.html), [rangos](https://www.postgresql.org/docs/18/rangetypes.html).
- Datos y trabajo: [Prisma7 requisitos](https://www.prisma.io/docs/orm/v7/reference/system-requirements), [Prisma7 transacciones](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions), [Drizzle releases](https://github.com/drizzle-team/drizzle-orm/releases), [pg-boss](https://github.com/timgit/pg-boss), [outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).
- Integraciones: [OpenAI herramientas](https://developers.openai.com/api/docs/guides/function-calling), [datos OpenAI](https://developers.openai.com/api/docs/guides/your-data), [Azure endpoints](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/switching-endpoints), [WhatsApp precios públicos](https://business.whatsapp.com/products/platform-pricing), [PayPhone notificación](https://docs.payphone.app/notificacion-externa), [Kushki Ecuador](https://docs.kushki.com/ec/).

La documentación acredita capacidades publicadas, no compatibilidad ejecutada, acceso comercial, cumplimiento jurídico ni desempeño del producto. No se ejecutó código de aplicación, prueba técnica o benchmark, ni se utilizaron credenciales o servicios de cuenta. Esta entrega finaliza en M0.2.
