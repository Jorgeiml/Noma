# M0.2 — Registro de verificación del stack

Fecha de verificación y revalidación documental: **26 de octubre de 2026, Ecuador**. Versión: 0.2 — revisión de compatibilidad y estados. Estado del stack: **PROPUESTO — PENDIENTE DE APROBACIÓN FINAL DEL DESARROLLADOR**.

## 1. Alcance y método

Se leyeron íntegramente [PRD.md](../product/PRD.md) y [OPEN_QUESTIONS.md](../product/OPEN_QUESTIONS.md), conservando sus bytes. Se investigaron páginas públicas oficiales mediante búsqueda y apertura de documentación; no se consultó una cuenta, no se usaron credenciales ni se ejecutaron operaciones de integración. Se analizaron tres stacks completos y catorce criterios ponderados en [TECH_STACK](TECH_STACK.md); las dieciséis decisiones de [STACK_DECISIONS](STACK_DECISIONS.md) siguen propuestas.

**V — Verificado en documentación oficial:** contenido efectivamente recuperado de una página del proyecto o proveedor. Esto acredita lo publicado, no acceso para nuestra cuenta, un contrato ni ejecución real. **I — Inferencia técnica:** conclusión de diseño basada en requisitos y capacidades. **S — Supuesto pendiente de validación:** información no demostrada, incluyendo experiencia del equipo, cargas, región, contratos y compatibilidad del conjunto exacto.

No se instalaron paquetes, inicializaron proyectos ni ejecutaron pruebas técnicas, benchmarks, llamadas a LLM, cobros o despliegues. La única comprobación ejecutada sobre la propuesta es documental: estructura, referencias, aritmética de la matriz y conservación de archivos. Ninguna combinación se declara probada en ejecución. Los ejemplos encontrados en páginas externas no se ejecutaron ni se incorporaron como código.

En esta corrección se volvieron a abrir fuentes oficiales de la candidata principal y se revisaron texto, versiones y estados; no se ejecutó código de aplicación, compilación, generación de cliente, instalación o prueba real. La matriz conserva sus valores revisados en la entrega anterior. Se diferencia recomendación arquitectónica aceptable de versión/composición provisional: ninguna queda aprobada definitivamente. Autenticación, hosting, Meta y pasarela de pago continúan sin proveedor seleccionado de forma definitiva.

## 2. Fuentes oficiales y versiones

**Todas las filas se consultaron el 26 de octubre de 2026.** «No fijada» significa que no se obtuvo o no se eligió un parche estable exacto; no autoriza seleccionar `latest` posteriormente sin revisión. Donde la página y las releases difieren, se registra la diferencia. Los requisitos mínimos no sustituyen el requisito de soporte vigente.

| ID | Tecnología y fuente oficial consultada | Hallazgo documental V | Soporte, mínimo o límite; lo que no queda demostrado |
| --- | --- | --- | --- |
| S01 | Node: [versiones](https://nodejs.org/en/about/previous-releases), [descarga](https://nodejs.org/en/download) | Página muestra 24.22.1 LTS y rama26 Current | Producción debe preferir ramas LTS; no inferir que Current es la mejor base; volver a comprobar parche al implementar |
| S02 | React: [versiones](https://react.dev/versions) | Documentación actual identifica 19.3 | No se comprobó parche exacto ni soporte de las bibliotecas de agenda/tablas elegidas; React/React DOM deben alinearse |
| S03 | Vite: [Vite8 estable](https://vite.dev/blog/announcing-vite8), [guía](https://vite.dev/guide/) | Publicación estable de Vite8; mínimo Node20.19+ o22.12+ | No se fijó parche ni plugin React; mínimo20 no significa soporte vigente de Node20 |
| S04 | Next: [instalación](https://nextjs.org/docs/app/getting-started/installation) | Página identifica 16.4.3 y mínimo Node20.9; TypeScript mínimo5.1 | No se verificó horizonte de soporte de esa rama ni plugins; se evaluó como alternativa de frontend, no como worker persistente |
| S05 | TypeScript: [5.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html), [6.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html) | Existen notas oficiales de ambas series | Base propuesta5.9 por menor salto de herramientas, I; no se verificó parche ni promesa LTS; compatibilidad de compilador y transformadores pendiente |
| S06 | Nest: [releases](https://github.com/nestjs/nest/releases), [paquete core11.2.8](https://raw.githubusercontent.com/nestjs/nest/v11.2.8/packages/core/package.json) | Release11.2.8 identificada Latest; core etiquetado exige Node>=20 y peers major11 | No acredita que todas las librerías/CLI funcionen en conjunto ni garantiza duración de mantenimiento; mantener majors alineadas |
| S07 | Nest: [guía de migración](https://docs.nestjs.com/migration-guide), [CLI](https://docs.nestjs.com/cli/overview) | Guía general habla de Nest12 y requisitos diferentes de runtime/schematics | Evidencia de documentación móvil, no prueba suficiente de release12 estable. No usar defaults de esa guía como defaults de11; validar CLI anclado |
| S08 | FastAPI: [notas](https://fastapi.tiangolo.com/release-notes/), [metadatos de desarrollo](https://raw.githubusercontent.com/fastapi/fastapi/master/pyproject.toml) | Se observan publicaciones ordinarias como0.156.1 y cambios incompatibles; metadatos de master indican Python>=3.10 | No se declara0.156.1 última versión ni se usa master como contrato de una release. Clase Beta en metadatos no basta para clasificar la aptitud comercial de todo el proyecto; versión de B, Python y dependencias deben anclarse juntos |
| S09 | .NET: [política oficial](https://dotnet.microsoft.com/en-us/platform/support/policy) | .NET10 LTS activo; página registra parche10.0.14 y horizonte2028; política abarca runtime, ASP.NET y EF | No extender ese soporte automáticamente a Quartz, Npgsql o cliente LLM. Usar parche seguro de10, no preview de11 por proximidad de publicación |
| S10 | PostgreSQL: [versionado y soporte](https://www.postgresql.org/support/versioning/) | Tabla:18.6 soportado hasta2030;17.11 soportado hasta2029; aviso19 RC1 | Recomendar18 no adopta19 RC. Motor soportado por ORM no implica soporte upstream de una rama antigua |
| S11 | PostgreSQL18: [RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html) | Políticas por fila y excepciones de roles privilegiados documentadas | Debe comprobarse identidad real de conexión y pooling. RLS no aísla objetos, archivos o trazas fuera de DB; no es una política ya implementada |
| S12 | PostgreSQL18: [aislamiento](https://www.postgresql.org/docs/18/transaction-iso.html) | Niveles de aislamiento y posibles fallos de serialización documentados | Elegir aislamiento requiere reintentos y diseño de operación; no se ejecutó carrera de reservas |
| S13 | PostgreSQL18: [rangos y exclusiones](https://www.postgresql.org/docs/18/rangetypes.html) | Rangos temporales y mecanismos para restringir solapamientos | No demuestra solución completa para recursos con capacidadN o secuencias; no se diseñaron restricciones físicas |
| S14 | Prisma7: [requisitos](https://www.prisma.io/docs/orm/v7/reference/system-requirements) | Node ^20.19, ^22.12 o ^24; TypeScript>=5.4 | Node24 cumple rango; compatibilidad de driver, módulo y pruebas no ejecutada |
| S15 | Prisma7: [motores](https://www.prisma.io/docs/orm/v7/reference/supported-databases) | PostgreSQL18 figura en lista | Soporte documental del motor no certifica SQL específico, permisos o servicio administrado |
| S16 | Prisma7: [transacciones](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions) | API de transacciones, incluidas interactivas | No confundir con documentación sin versión que redirige a API8; no presume atomicidad con conexión de pg-boss |
| S17 | Prisma7: [funciones no representadas](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/unsupported-database-features) | No toda función DB tiene equivalente en lenguaje de esquema | Revisar SQL específico y conservación en evolución posterior; no se escribió modelo ni migración |
| S18 | Prisma: [releases](https://github.com/prisma/orm/releases), [página no versionada observada](https://www.prisma.io/docs/orm/fundamentals/transactions) | Releases identifica7.10.1 estable y8.0.0 RC; página general ya describe8 | Se ancla propuesta a7 y su documentación; no asumir soporte perpetuo ni importar sintaxis8 a7 |
| S19 | Drizzle: [releases](https://github.com/drizzle-team/drizzle-orm/releases), [introducción](https://orm.drizzle.team/docs/overview) |0.45.4 identificada Latest;1.0.0-rc.5 marcada prerelease | Alternativa evaluada:0.45.4, no1RC. No se verificó kit/controlador/compilador conjunto ni política LTS |
| S20 | SQLAlchemy: [asyncio2.0](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) | Documentación2.0 disponible; navegación distingue2.1 actual y2.0 de mantenimiento | B deberá escoger una serie soportada, driver y Alembic compatibles; sesión no se debe compartir entre tareas concurrentes. No se fijó parche |
| S21 | EF: [versiones](https://learn.microsoft.com/en-us/ef/core/what-is-new/); Npgsql: [release10](https://www.npgsql.org/efcore/release-notes/10.0.html) | EF10 y proveedor Npgsql para EF10 tienen documentación de publicación | Familia de C coherente; compatibilidad de dependencias exactas y jobs sigue por probar |
| S22 | pg-boss: [proyecto](https://github.com/timgit/pg-boss), [releases](https://github.com/timgit/pg-boss/releases) |12.38.0 identificada Latest; pide Node>=22.12 y PostgreSQL>=13 | Node24/PG18 satisfacen mínimos; no equivale a prueba de nuestro uso. No prometer exactamente una vez en cobro o mensaje externo aunque una biblioteca anuncie garantías de cola |
| S23 | BullMQ: [conexiones](https://docs.bullmq.io/guide/connections), [trabajos detenidos](https://docs.bullmq.io/guide/workers/stalled-jobs) | Documenta conexiones y recuperación de trabajos cuyo bloqueo deja de renovarse | Se evaluó variante respaldada por Redis; no se afirma que sea la única modalidad del producto. Parche y configuración de persistencia no verificados |
| S24 | Celery: [introducción estable](https://docs.celeryq.dev/en/stable/getting-started/introduction.html) | Sitio identifica5.6/5.6.3, trabajadores y broker; advierte falta de soporte Windows | La propia página contiene tabla heredada de5.5; no convertirla en prueba exacta de mínimos5.6. Validar Python y broker anclados; Linux/WSL posterior si se eligeB |
| S25 | Quartz.NET: [persistencia](https://www.quartz-scheduler.net/documentation/quartz-3.x/tutorial/job-stores.html) | Describe persistencia ADO y proveedor Npgsql/PostgreSQL | Planificador3.x evaluado documentalmente, parche estable exacto no verificado; probar .NET10/Npgsql10, clusterización y misfires si se eligeC |
| S26 | Auth0: [organizaciones](https://auth0.com/docs/manage-users/organizations) | Capacidad de representar clientes B2B y membresías documentada | Funciones disponibles en plan, cantidad de organizaciones, costos, exportación, región, sesiones y revocación no contratados ni probados |
| S27 | Keycloak: [operación en contenedor](https://www.keycloak.org/server/containers) | Ruta autogestionada documentada | No se creó contenedor ni se eligió release; operar identidad sigue a cargo del equipo si se selecciona |
| S28 | Supabase: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Documenta defensa mediante políticas PostgreSQL y contexto de acceso | No acredita aislamiento automático por usar Supabase ni valida funciones como workers de duración arbitraria |
| S29 | OpenAI: [SDKs](https://developers.openai.com/api/docs/libraries) | Disponibilidad de bibliotecas oficiales para integración | No se fijó parche de SDK ni modelo; no se consultó acceso de cuenta |
| S30 | OpenAI: [herramientas](https://developers.openai.com/api/docs/guides/function-calling) | Protocolo de solicitud de herramientas y retorno de resultados | El backend sigue autorizando y ejecutando; llamada del modelo no acredita éxito comercial |
| S31 | OpenAI: [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs) | Restricciones de forma/esquema para salidas y herramientas | No demuestra veracidad del precio, permiso o disponibilidad; límites por modelo/API se validan al seleccionar |
| S32 | OpenAI: [controles de datos](https://developers.openai.com/api/docs/guides/your-data) | Se documentan controles y condiciones por funcionalidad | No prometer retención cero, residencia, acceso especial o política idéntica para todo endpoint; revisión de contrato y OQ-SEC-01 pendiente |
| S33 | Microsoft: [OpenAI/Azure endpoints](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/switching-endpoints) | Artículo explica endpoint, autenticación y diferencias de despliegue | Ejemplo Python no prueba paquete TypeScript elegido ni paridad de funciones/modelos; cuotas, región y precios no verificados para la cuenta |
| S34 | LangGraph: [visión TypeScript](https://docs.langchain.com/oss/javascript/langgraph/overview) | Capacidades de orquestación persistente, estado y control humano | No se fijó release/SDK/checkpointer; no elimina alucinación ni idempotencia; alternativa, no requisito obligatorio |
| S35 | AI SDK: [introducción](https://ai-sdk.dev/docs/introduction) | Abstracción de integración de modelos y herramientas documentada | No se verificó paridad de proveedores, parche o todas las funciones; alternativa sin instalar |
| S36 | Meta: [precios públicos](https://business.whatsapp.com/products/platform-pricing) | Redirige a dominio WhatsApp Business y muestra categorías/cobro por entrega según mercado | Vista general no es tarifa contractual Ecuador ni validación completa de gratuidad/ventanas. Páginas técnicas fallaron; ver sección3 |
| S37 | PayPhone: [API Link](https://docs.payphone.app/api-link) | Links con importe conocido e identificador; documentación de reversos | No demuestra acceso aprobado del comercio, idempotencia integral ni disponibilidad de todo tipo de devolución |
| S38 | PayPhone: [Notificación Externa](https://docs.payphone.app/notificacion-externa) | Servicio requiere autorización previa y describe avisos de pagos aprobados | No asumir que notifica todos los fallos ni activación automática. Mecanismo completo de autenticidad y consulta para producto elegido pendiente |
| S39 | PayPhone: [Botón](https://docs.payphone.app/boton-de-pago), [portal](https://docs.payphone.app/) | Describe confirmación, condición temporal y reversos; portal publica tarifa general | No extrapolar el plazo de un producto a Link sin contrastar; tarifa general no es contrato del SaaS. Tokenización anunciada no prueba recurrencia automática |
| S40 | Kushki: [Ecuador](https://docs.kushki.com/ec/), [Smartlinks y webhooks](https://docs.kushki.com/ec/en/notifications/smartlinks/smartlinks/) | Documentación de país y eventos aprobados/rechazados para Smartlinks | Autenticación íntegra de notificaciones, conciliación, devolución parcial, comisiones y recurrencia habilitada por comercio no comprobadas completamente |
| S41 | Vercel: [límites de funciones](https://vercel.com/docs/functions/limitations) | Las funciones tienen límites de ejecución | No se elige duración/plan ni se confunde función con trabajador continuo; capacidad estática no certifica el backend persistente |
| S42 | Render: [trabajadores](https://render.com/docs/background-workers), [PostgreSQL](https://render.com/docs/postgresql-creating-connecting), [backups](https://render.com/docs/postgresql-backups) | Trabajadores continuos, oferta PG18 y recuperación temporal en bases pagadas documentados | Ventana depende de plan; no se fijó contrato, parche, región ni SLA. Revisar TLS, roles, extensiones, red y exportación; recuperación de DB no incluye objetos externos |
| S43 | AWS: [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html), [S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html), [outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) | Procesos en contenedores administrados, almacenamiento de objetos y patrón para doble escritura documentados | No se verificó región, precio o RDS exacto ni se desplegó nada; outbox es patrón inferido para este producto, no infraestructura ya existente |
| S44 | Calidad: [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro) | Vitest publica mínimo Node22.12 y Vite6.4; Playwright documenta instalación y ejecución de pruebas de navegador | Versiones/parches, transformador Nest, React Testing Library, Jest, ESLint, Prettier y Testcontainers del conjunto no se verificaron en ejecución ni se fijaron |
| S45 | OpenTelemetry: [JavaScript](https://opentelemetry.io/docs/languages/js/) | Ecosistema de instrumentación y señales documentado | Madurez y compatibilidad se revisan por señal y paquete; no declarar todas las señales/exportadores igualmente estables; versión y destino pendientes |
| S46 | Drizzle: [visión general](https://orm.drizzle.team/docs/overview); Prisma: [limitaciones7](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/unsupported-database-features) | Permiten contrastar acceso cercano a SQL frente a abstracción del ORM | No se ejecutó comparación de rendimiento ni prueba de preservación de restricciones; preferencia por Prisma es I y reversible antes de implementar |

### Versiones que se proponen y estado de soporte conocido

Node24 LTS, React19.3, Vite8, Nest11.2.8, PostgreSQL18 y Prisma7.10.1 con pg-boss12.38.0 forman la línea A propuesta. Se conoce LTS de Node y soporte upstream de PostgreSQL; no se inventa una garantía LTS conjunta para Nest, React, Vite, Prisma o pg-boss. Algunas páginas generales adelantan otra major. Se debe revalidar parche seguro, fecha de mantenimiento y compatibilidad antes de fijar dependencias. TypeScript5.9 es base de evaluación, no afirmación de última versión:6.0 ya tiene documentación y se comparará con el resto de herramientas.

B tiene ruta FastAPI/Python, SQLAlchemy/Alembic y Celery/broker; se verificaron familias y publicaciones, pero **no** un conjunto exacto de versiones de ejecución. C tiene ruta .NET10/EF10/Npgsql10 y Quartz persistente; el horizonte LTS de la plataforma no prueba integración de todos sus paquetes. Ambas son alternativas reales, con trabajo de validación equivalente al de A.

## 3. Accesos incompletos, discrepancias y límites de la evidencia

| Caso | Observación real | Tratamiento documental |
| --- | --- | --- |
| Meta, rutas de Cloud API y overview | La herramienta devolvió429 en rutas antiguas y de nueva documentación | No se afirma haber leído su contenido completo; incorporación multiempresa, firma, límites y Graph version quedan pendientes |
| Meta, ruta técnica de precios | Se recuperó pantalla de login, sin contenido técnico | No usar credenciales ni inferir tarifas de fragmentos de búsqueda; la página pública general solo respalda categorías y modelo general de cobro |
| Política WhatsApp, ruta intentada | URL devolvió404 | No citarla como política vigente leída; consentimiento y reglas del canal permanecen como validación bloqueante de activación |
| Guía Nest general frente a releases | Guía habla de12; releases y paquete etiquetado muestran11.2.8 estable | Anclar11; no importar requisitos/features de12 ni afirmar que12 está listo por existir la guía |
| Prisma general frente a releases | Documentación no versionada describe8; releases lo muestra RC, mientras7.10.1 está identificado estable | Consultar `/v7/`; excluir8 RC como dependencia fundamental |
| Drizzle1 | Publicación1.0.0-rc.5 marcada prerelease | Comparación de producción con0.45.4; no «estable1» |
| PostgreSQL19 | Aviso RC mientras tabla mantiene18 soportado | Recomendar18 soportado, no19 RC |
| Celery | Cabecera5.6.3 con tabla interna que aún menciona5.5 | No inventar requisitos mínimos exactos5.6 a partir de una tabla heredada |
| Render versiones, ruta específica intentada | Una URL inicial no fue accesible; sí se recuperó Create and Connect | Usar fuente recuperada que documenta13–18; no interpretar error de URL como ausencia de PG18 |
| Quartz, ruta de integración intentada | Una ruta inicial no fue accesible; Job Stores sí documenta Npgsql | Respaldar capacidad con página leída, no con ruta fallida; composición .NET10 sigue pendiente |
| Kushki seguridad y devolución | Documentación de Smartlinks recuperada; no se completó verificación del mecanismo de autenticidad ni condiciones de reembolso parcial | Mantener proveedor provisional; no afirmar garantía de webhook firmado o devolución parcial disponible |
| Tarifas, región y contratos | No existe cotización específica para nuestra operación | No se publica costo total actual ni conclusión de cumplimiento o acceso por cuenta |

Una búsqueda o un enlace no abierto no prueba una capacidad. Las fuentes de páginas oficiales que sí se recuperaron respaldan solamente los hallazgos explícitos anteriores. El registro no transforma publicidad del proveedor sobre facilidad o seguridad en evaluación experimental de este producto.

## 4. Compatibilidad comprobada documentalmente

| Relación | Comprobación V | Conclusión permitida |
| --- | --- | --- |
| Node24.22.1 y Vite8 | S01/S03: Node24 satisface mínimo | Compatible por requisito declarado, no build ejecutado |
| Node24.22.1 y Nest11.2.8 core | S01/S06: core exige>=20 | Rango de runtime satisfecho; CLI y plugins no acreditados |
| Node24, TypeScript5.9 y Prisma7 | S14: Node24 incluido, TS>=5.4 | Rango documental satisfecho, dependencias exactas por resolver |
| Prisma7 y PostgreSQL18 | S15 incluye motor18 | Soporte publicado; no prueba de RLS, locks ni servicio administrado |
| pg-boss y Node24/PG18 | S22: Node>=22.12 y PG>=13 | Mínimos satisfechos; garantía real de ejecución y carga por probar |
| Render y procesos continuos/PG18 | S42 recupera ambas capacidades | Candidato de hosting viable documentalmente; contrato y restore no validados |
| .NET10, EF10 y Npgsql10 | S09 y S21 publican familias compatibles | Alternativa C coherente a nivel de plataforma/proveedor; conjunto no ejecutado |
| PostgreSQL y Quartz | S25 documenta Npgsql como proveedor | Persistencia planificada es opción; equivalencia con cola y composición10 no supuestas |

Se distingue «el mínimo permite esta rama» de «el fabricante probó nuestro conjunto exacto». No se calculan garantías de disponibilidad o concurrencia a partir de esta tabla. La compatibilidad entre React y cada biblioteca visual, proveedor OIDC y cookies, SDK y endpoint de modelo, y controlador DB y pooling/RLS requiere pruebas.

### 4.1 Revalidación de la candidata principal, sin ejecución

Fuentes abiertas de nuevo el **26 de octubre de 2026**. Se conservan S01–S46 como catálogo de la investigación inicial; RC identifica comprobaciones de esta corrección y no añade proveedores aprobados.

| ID | Cruce y fuente abierta | Resultado documental | Alcance pendiente |
| --- | --- | --- | --- |
| RC-01 | Nest11.2.8/Node24: [última release oficial](https://github.com/nestjs/nest/releases/latest), [core etiquetado](https://raw.githubusercontent.com/nestjs/nest/v11.2.8/packages/core/package.json), [guía general](https://docs.nestjs.com/migration-guide) | El enlace redirige a v11.2.8; core pide Node>=20 y peers Nest11. La guía habla de12: no es prueba de release estable12 ni de incompatibilidad de11 con24 | Mantener11.2.8 como referencia candidata; verificar CLI11, paquetes, mantenimiento, decoradores y runner antes de fijar conjunto |
| RC-02 | Node24 LTS: [descarga](https://nodejs.org/en/download), [ciclo de releases](https://nodejs.org/en/about/previous-releases) |24.22.1 se muestra como LTS y satisface los rangos publicados de las piezas candidatas | Cumplir mínimos no certifica todas las dependencias transitivas; parche seguro y carga por revisar |
| RC-03 | Prisma7/Node24/TypeScript/PG18: [requisitos7](https://www.prisma.io/docs/orm/v7/reference/system-requirements), [motores7](https://www.prisma.io/docs/orm/v7/reference/supported-databases) | Node24 incluido; mínimo TS5.4, por lo que5.9 satisface ese mínimo; PG18 aparece soportado | Adaptador/controlador, SQL específico, configuración y compatibilidad de Nest no probados por estos rangos |
| RC-04 | Prisma7 con Nest y módulos: [receta Nest](https://docs.nestjs.com/recipes/prisma), [generador7](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators), [guía de actualización7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) | Ruta PostgreSQL directa requiere adaptador; generador permite ESM o CommonJS. La receta alerta contra CLI8 prerelease y distingue formato de cliente | No adoptar defaults actuales de Nest como defaults de11. Alinear cliente/CLI/adaptador7, imports, compilación, pool y pruebas; ESM continúa preferencia provisional |
| RC-05 | pg-boss12.38.0/Node24: [manifiesto etiquetado](https://raw.githubusercontent.com/timgit/pg-boss/12.38.0/package.json), [requisitos del proyecto](https://github.com/timgit/pg-boss) | Manifiesto declara ESM, Node>=22.12, dependencia pg y peer de API OpenTelemetry^1.9.0; proyecto documenta PG>=13 | PG18 cumple mínimo documentado, no está probado con nuestra cola. Revisar módulos, permisos, pools y peers; dependencias de desarrollo del proyecto no certifican nuestro ensamblaje |
| RC-06 | React/Vite/Node24: [React](https://react.dev/versions), [Vite](https://vite.dev/guide/) | React19.3 publicado; Vite exige Node20.19+ o22.12+, satisfecho por24 | No se verificó conjunto exacto de React DOM, plugin React para Vite8, agenda y tablas ni build; rangos de Vite no equivalen a prueba de toda la UI |
| RC-07 | PostgreSQL18: [soporte oficial](https://www.postgresql.org/support/versioning/) | Tabla mantiene18 como rama soportada y19 como RC en aviso; se conserva18 candidata | Permisos/extensiones/backup del proveedor, concurrencia y RLS deben demostrarse posteriormente |
| RC-08 | Prisma7.10.1: [release etiquetada](https://github.com/prisma/orm/releases/tag/7.10.1) | Se recuperó publicación estable7.10.1 como referencia, sin sustituirla por documentación8 | Composición exacta de paquetes7 y soporte vigente al comenzar; no se infiere ausencia total de bugs |

**Dictamen documental:** no se confirmó una incompatibilidad bloqueante entre familias y rangos publicados de la candidata. Se mantienen advertencias de ensamblaje pendientes; no se afirma que «todo es compatible» ni que no existen incidencias conocidas en esos proyectos. No se encontró evidencia que justifique cambiar la recomendación global en esta corrección.

### 4.2 Inconsistencias y omisiones documentales corregidas

| Punto revisado | Corrección aplicada en los tres documentos | Naturaleza |
| --- | --- | --- |
| Nest12 en guía frente a release11.2.8 | Reconfirmar enlace de release y core etiquetado; distinguir runtime de CLI y plugins | Discrepancia externa documentada; no bloqueo de runtime demostrado |
| «ESM» presentado como dirección única sin alternativas suficientemente explícitas | Mantener preferencia provisional, documentar cliente Prisma ESM/CommonJS y necesidad de acuerdo con servidor, worker, compilador y runner | Precisión de diseño; no obligación universal de Prisma |
| Ruta Prisma/PostgreSQL incompleta | Explicitar adaptador para conexión directa, alineación cliente/CLI7 y verificación del controlador, TLS, pools y cierre | Omisión corregida; no paquete instalado |
| Dependencias de pg-boss sin precisión por versión | Añadir manifiesto12.38.0 con ESM y peer de instrumentación; separar API de instrumentación de un despliegue APM | Omisión corregida, sin agregar infraestructura obligatoria |
| Lista de testing podía leerse como compatibilidad cerrada | Hacer provisional Jest/transformador y formato del cliente generado hasta prueba integrada | Afirmación acotada a propuesta de herramientas |
| Estado de dirección arquitectónica confundible con detalles listos para aprobar | Registrar seis direcciones aceptables sujetas a aprobación final y mantener P0, proveedores y composición provisionales | Estado documental corregido, sin aprobación inventada |
| Prisma y cola en el mismo PostgreSQL | Reafirmar transacción local de negocio+outbox y despacho posterior; compartir motor no une transacciones/pools | Límite ya existente precisado; no diseño físico ni implementación |

## 5. Compatibilidades no verificadas

1. Nest11, su adaptador HTTP, CLI11, TypeScript elegido, formato ESM/CommonJS y pruebas Jest/transformador de decoradores con cliente Prisma7 generado y pg-boss12 ESM. No se copiaron defaults de Nest12 ni se inicializó proyecto.
2. Plugin React de Vite8 y biblioteca de agenda/tablas/formularios con React19.3, accesibilidad y comportamiento en dispositivos del segmento.
3. Alineación cliente/CLI/adaptador PostgreSQL7, controlador, TLS y ciclo de vida/presupuesto de conexiones entre API y worker; SQL específico para no solapamiento, capacidadN, locks y RLS con roles reales y servicio administrado; ORM no certifica invariantes.
4. Atomicidad entre datos y programación: no se comprobó una conexión transaccional común Prisma/pg-boss; se propone outbox para no depender de ella.
5. Reintentos bajo pérdida de conexión, reinicio de trabajadores, timeout del proveedor y restauración de DB con eventos externos más recientes.
6. OIDC con sesión del backend, dominios, cookies, CSRF, CORS, recuperación, invitaciones, baja de empleados y revocación de soporte.
7. Incorporación WhatsApp de múltiples negocios, propiedad/migración/coexistencia de números, plantillas, evidencia de consentimiento, límites y versión Graph admitida.
8. Verificación fiable, consulta, reverso/devolución parcial, comisiones y recurrencia por producto PayPhone/Kushki y por comercio. No asumir que la notificación tiene todas las garantías que necesita el PRD.
9. Disponibilidad de modelo por región/cuenta, salidas estructuradas y herramientas concretas por endpoint, condiciones de datos y costos por tarea en OpenAI/Azure.
10. Rendimiento, continuidad y costo total del despliegue desde Ecuador; backups de DB/objetos, límites de conexión y restauración a objetivos todavía no definidos.

## 6. Supuestos de la recomendación

| ID | Supuesto S | Efecto si resulta falso |
| --- | --- | --- |
| SV-01 | El desarrollador no tiene una ventaja de experiencia demostrada en C# o Python que compense las convenciones comunes de TypeScript | Recalcular mantenimiento; C o B pueden empatar/superarA sin alterar requisitos |
| SV-02 | Carga inicial puede gestionarse con PostgreSQL compartido para negocio y jobs, con límites de conexiones y trabajo | Separar capacidad/cola o elegir broker administrado tras medición |
| SV-03 | Es admisible una frontera inicial de datos compartida con controles rigurosos | Evaluar DB por tenant o despliegue dedicado si contrato/privacidad lo exigen |
| SV-04 | Hosting administrado propuesto cumple región, permisos y recuperación una vez contratadas opciones adecuadas | Cambiar plan o proveedor, evaluar AWS u otra ruta antes de desplegar |
| SV-05 | Existe una integración de WhatsApp y cobro que puede habilitarse legal y comercialmente para el modelo multiestablecimiento | Modificar adaptador/incorporación; no eliminar agenda manual ni fingir evidencia de pago |
| SV-06 | Los recorridos conocidos de IA se pueden expresar con orquestación explícita mantenible | Revaluar LangGraph u otro motor si crecen ramificación, interrupciones y recuperación, sin delegar reglas críticas |
| SV-07 | Paquetes estables propuestos conservan soporte y seguridad al iniciar implementación | Actualizar parches/ramas y repetir validación; no congelar versiones vulnerables por figurar en este documento |

Los supuestos no aprueban política comercial: valoración obligatoria, devolución, anticipo, membresía, límite de frecuencia, precio del SaaS y umbral de inactividad permanecen en el registro original.

## 7. Comprobación de la matriz y sensibilidad

Pesos en orden de TECH_STACK: **12,12,10,12,5,10,7,5,5,4,4,5,5,4**, suma **100**.

| Stack | Puntuaciones en el mismo orden | Suma ponderada | Total /5 | Total /100 |
| --- | --- | --- | --- | --- |
| A |5,4,4,5,4,4,4,4,4,4,4,4,4,4 |424 |4,24 |84,8 |
| B |5,4,4,5,4,3,4,4,4,4,3,3,4,4 |405 |4,05 |81,0 |
| C |5,4,4,5,4,3,4,5,4,4,4,4,4,4 |419 |4,19 |83,8 |

Se comprobó el cálculo aritmético con los valores registrados, no la «verdad» de las puntuaciones. Cada puntuación y peso tiene explicación en TECH_STACK. Todos son juicios técnicos; experiencia y carga no medidas introducen incertidumbre. DiferenciaA–C=0,05: empate práctico, no superioridad demostrada.

Sensibilidad: mover5 de peso de mantenimiento a madurez mantieneA=4,24 y llevaC=4,29; subir mantenimientoC de3 a4 también produceC=4,29. Para B, subir mantenimiento3→4, despliegue3→4 y costos3→4 tras validar experiencia y alternativa sin broker produceB=4,24. No se trata la configuración Celery/Redis de B como la única posible forma de usar Python.

## 8. Riesgos de obsolescencia y mantenimiento

Antes de fijar herramientas y antes de operar, verificar releases, soporte, vulnerabilidades, licencias, dependencias transitivas y disponibilidad por proveedor. Revalidar al cambiar runtime/major, driver, proveedor de identidad, modelo, integración de pago, políticas de WhatsApp, región o contrato. No se inventa una frecuencia universal de actualización ni una promesa de soporte que el proyecto no publica.

Los riesgos inmediatos observados son documentación general que adelanta nuevas versiones, RC confundidas con estables, tablas heredadas de requisitos, cambios de modelos/API, condiciones cambiantes de mensajes y costo de restauración/exportación. Un lockfile futuro facilita reproducibilidad, pero no demuestra seguridad ni sustituye actualizar parches. No existe lockfile en M0.2.

## 9. Pruebas técnicas recomendadas para milestones posteriores

**Estado de todas las pruebas: NO EJECUTADA.** No se crea su código aquí ni se inicia M0.3. Los identificadores sirven para revisar la propuesta cuando el desarrollador autorice la etapa correspondiente. Ninguna usa dinero real ni datos personales reales como condición inicial.

| ID | Prueba futura y escenario | Resultado comprobable y criterio de revisión del stack | Referencia |
| --- | --- | --- | --- |
| VT-01 | Ensamblar conjunto estable anclado: Node24, Nest11, Prisma7 con adaptador PostgreSQL, TS, formato de módulos, pg-boss12, transformador y tests | Compilar, generar cliente y ejecutar prueba de módulo/HTTP/DB/worker sin mezclar majors ni depender de RC; imports, decoradores, peers, cierre y pools correctos. Contrastar ESM candidato con alternativa coherente si hace falta; si falla, corregir herramientas antes de construir dominios | TD-003, TD-005, TD-008, TD-016 |
| VT-02 | Panel React/Vite, navegación, formularios y agenda representativos | Build de producción y recorrido buscar/crear/guardar/corregir con teclado y perfiles acordados; sin pasos digitales obligatorios; librería visual/licencia revisada | FR-MOD02-006; OQ-EXP-05 |
| VT-03 | Dos clientes sobre horario exclusivo, uno manual y otro simulado de WhatsApp; repetir con recurso compartido | No exceder capacidad; operación perdedora obtiene conflicto/alternativa, ganadora repetida recupera su resultado; comprobar con conexiones concurrentes reales, no secuencia de mocks | FL-13; RN-01, RN-26 |
| VT-04 | Recursos con capacidadN, servicios combinados, preparación y ubicaciones | Todas las reglas finalmente aprobadas de OQ-AGE-01 se mantienen bajo carrera y reintento; no declarar válida una solución de exclusión de recurso exclusivo para todos los casos | FR-MOD02-001; FR-MOD03-004 |
| VT-05 | Expirar retención mientras llega pago; repetir evidencia y alterar orden | Dinero no duplicado, horario ocupado no confirmado, incidencia conciliable; una única resolución válida entre transición de vencimiento y confirmación | FL-12; FR-MOD05-004 |
| VT-06 | Desde/rango/sujeto a valoración; cotización revisada antes y después de aceptación; valoración gratuita/pagada | Orientativo nunca se presenta como garantizado sin regla; versión aceptada identificable; anticipo conocido admite total pendiente; diferencia de dinero visible sin sustituir historia | FL-18 y FL-19; FR-MOD05-006 |
| VT-07 | Última sesión o recompensa usada simultáneamente; cancelación y repetición de evento | No saldo negativo, doble uso ni doble restitución; movimientos reconstruibles bajo política aprobada | FR-MOD09-001 a 003 |
| VT-08 | NegocioA consulta/cambia/reportea/descarga datosB; alternar conexiones del pool y jobs | Denegación sin fuga ni estado residual; ejecutar con rol real no privilegiado y revisar excepciones de soporte/migración; ausencia de tenant no habilita acceso global | FR-MOD12-004; RNF-03 |
| VT-09 | Cambio+outbox, caída antes/después de publicar y ejecutar trabajo | Intención durable tras commit, ejecución reintentable y efecto de negocio deduplicado; estados de cola no sustituyen estado de negocio | TD-008; RNF-04 |
| VT-10 | Envío incierto, baja después de programar, cita cancelada, cotización rechazada y toma humana durante generación | No despachar promoción no elegible ni respuesta IA competidora; eventos obsoletos quedan suprimidos; timeout no provoca repetición ciega de cobro/mensaje | FL-11 y FL-14; FR-MOD07-006 |
| VT-11 | WhatsApp/IA sin configurar y luego indisponibles, manteniendo plataforma disponible | FL-16/17 y modificaciones de agenda operables; CRM, pagos/beneficios permitidos y reportes conservan datos; recuperar canal no duplica reservas | FR-MOD02-007; FR-MOD12-001 |
| VT-12 | OIDC, sesiones, baja de empleado, cambio de tenant y soporte revocado | Firma/audience/issuer/caducidad comprobados; permisos vigentes prevalecen; cookies y CSRF/CORS correctos para dominios reales; no acceso global por rol del proveedor | TD-007; OQ-SEC-03 |
| VT-13 | Contratos de pagos con fixtures inválidos/duplicados/tardíos, luego sandbox autorizado en su milestone | Evidencia confiable por producto, consulta y devolución según capacidades efectivas; no asumir recurrencia ni webhook disponible. Selección de proveedor se revisa si falta capacidad crítica | TD-012; OQ-INT-02 |
| VT-14 | Incorporación WhatsApp, verificación de entrada, plantillas y estados con entorno autorizado futuro | Demostrar multiempresa, permisos, autenticidad y reglas de envío del producto concreto; si no es viable directamente, comparar proveedor autorizado | TD-011; OQ-INT-01 |
| VT-15 | Evaluaciones de herramientas y conversaciones españolas versionadas; modelos candidatos | Errores de esquema, permiso y fuente no crean éxito; no inventar precios, diagnóstico ni pago; medir calidad/derivación, latencia y costo por tarea con criterios humanos acordados | TD-009 y TD-010 |
| VT-16 | Restauración aislada de DB/objetos y conciliación con pagos/mensajes más recientes que backup | Integridad de agenda y saldos, trabajo pendiente visible y no repetición ciega de efectos externos; medir contra RPO/RTO aprobados. Revisar hosting si no cumple | RNF-12; OQ-ARC-02 |
| VT-17 | Carga representativa y prueba de consumo por tenant desde Ecuador | Medir latencia, errores, conexiones, atraso de cola, costos y actualización de reportes contra objetivos acordados; revisar Redis/servicio o tamaño solo con evidencia | RNF-09/13; OQ-ARC-03 |
| VT-18 | Reportes por origen y etapas monetarias, valoración aplicada al servicio y pagos parciales | Totales concilian con hechos, sin duplicar anticipos ni cobro de valoración; sin total confirmado no se inventa deuda o ingreso; origen manual no se atribuye a IA | FR-MOD11-003 y 006; MET-15 a 17 |

## 10. Decisiones que requieren intervención humana

Ninguna de estas preguntas se modifica en OPEN_QUESTIONS. Se requiere decisión antes de comprometer la parte de diseño o activar la operación dependiente, no resolverlas todas para leer esta propuesta.

| P0 original | Información y aprobación necesarias | Propuesta condicionada y alternativa |
| --- | --- | --- |
| OQ-PRO-02 | Qué negocio/persona jurídica/marca es tenant y cómo agrupa sucursales | Compartida con controles; separar DB si frontera/contrato lo exige |
| OQ-AGE-01 | CapacidadN, secuencias, preparación y traslados | PostgreSQL con mecanismo transaccional a diseñar después, no una restricción universal inventada |
| OQ-PAY-01 | Anticipo, retención, vencimiento y reserva condicionada | Estados y evidencia separados, compensación/conciliación; distintas políticas siguen disponibles |
| OQ-PAY-04 | Cobros antes/después de confirmar precio y efectos de revisión/cancelación | Importe conocido por concepto sin total inventado; variantes de anticipo del PRD |
| OQ-MKT-01 | Evidencia de consentimiento, finalidades, bajas y mensajes mixtos | Revalidación al enviar; bloquear promoción sin evidencia, no eliminar campañas |
| OQ-SEC-01 | Datos, finalidades, responsabilidades, terceros/transferencias y condiciones aplicables | Región/modelo/proveedor provisional; alternativa de gobierno o separación diferente |
| OQ-SEC-03 | Identidad y permisos sensibles de personal, clientes y soporte | OIDC administrado más autorización propia; autogestión si se justifica |
| OQ-INT-01 | Integración WhatsApp, incorporación multiempresa, titularidad y condiciones de números | Cloud API directa provisional; proveedor autorizado si conviene/si se requiere |
| OQ-INT-02 | Proveedor/producto con evidencia, devolución, conciliación, comisiones y recurrencia realmente habilitadas | PayPhone candidato y Kushki comparado; cambiar proveedor sin reemplazar agenda/CRM |
| OQ-ARC-01 | Experiencia del ingeniero y aprobación de stack con pruebas pendientes | A propuesto, C empatado en la práctica, B viable; no se resuelve por puntaje únicamente |
| OQ-ARC-02 | Objetivos de servicio, pérdida tolerable, recuperación y contingencias | Servicios administrados propuestos; mayor continuidad o proveedor alternativo según objetivos |

Además, facultades para confirmar precio, aceptación previa al inicio, cobro/descuento de valoración, políticas de fidelización, dispositivos/accesibilidad, perfiles de uso y condiciones comerciales SaaS siguen pendientes. Solo se hace referencia a sus identificadores en los otros documentos; no se inventan acuerdos.

## 11. Conservación del alcance y archivos originales

Huellas SHA-256 tomadas antes de redactar esta entrega, para contrastar al terminar:

| Archivo original | SHA-256 |
| --- | --- |
| docs/product/PRD.md |552781790A718786D4C7177510691CABA812705D337C38A51F1EBB882094F004 |
| docs/product/OPEN_QUESTIONS.md |6BBC5A7BA773D711834031B085A32F1EB3DACCD9F32C523702225E447E125D07 |

Archivos nuevos permitidos: TECH_STACK.md, STACK_DECISIONS.md y STACK_VALIDATION.md dentro de docs/architecture. No se creó otro archivo, código, modelo físico, API, migración, contenedor, proyecto, configuración cloud o AGENTS.md; no se inicializó Git ni se instalaron dependencias. No se accedió a credenciales ni cuentas externas. La investigación pública de documentación no constituye integración real.

## 12. Lista de validación final de M0.2

| Punto solicitado | Resultado documental | Evidencia y límite |
| --- | --- | --- |
| 1. Lectura de ambos documentos M0.1 | Comprobado | PRD completo y43 preguntas revisadas; huellas originales conservadas |
| 2. Doce módulos representados | Comprobado | Tabla de contexto de TECH_STACK con MOD-01 a MOD-12 y referencias FR |
| 3. Al menos dos stacks completos | Comprobado | A TypeScript, B Python, C.NET con datos, asíncrono, identidad, IA, despliegue y pruebas |
| 4. Matriz consistente | Comprobado |14 criterios, pesos100, totales4,24/4,05/4,19 y sensibilidad explícita |
| 5. Decisiones justificadas | Comprobado |16 TD, contexto, alternativas, consecuencias y estado propuesto |
| 6. Agenda y pagos críticos | Comprobado documentalmente | Concurrencia, retenciones, tardíos, dinero, outbox, idempotencia; VT-03 a VT-09 y VT-13 no ejecutadas |
| 7. Operación sin IA/WhatsApp | Comprobado como condición de diseño | Proceso manual no depende de modelo/canal; VT-11 pendiente |
| 8. Precio sujeto a valoración | Comprobado | Separación orientativo/confirmado/aceptado/cobrado y anticipo conocido; VT-06 y VT-18 pendientes |
| 9. Aislamiento multitenant | Comprobado documentalmente | Comparación de tres estrategias, roles, RLS y pool; VT-08 pendiente |
| 10. Preguntas P0 bloqueantes | Comprobado | Las once P0 originales están relacionadas con decisiones, faltantes y alternativas |
| 11. Versiones/documentación con internet | Comprobado con límites explícitos | Fuentes oficiales abiertas, majors/patches conocidos, RC excluidas, accesos fallidos registrados |
| 12. Fuentes e inferencias diferenciadas | Comprobado | V/I/S, supuestos SV y compatibilidad documental separada de ejecución |
| 13. Tres documentos solicitados | Comprobado | Solo los tres archivos nuevos de arquitectura |
| 14. Originales no modificados | Comprobado por SHA-256 | Ambas huellas deben coincidir con sección11 al finalizar |
| 15. Sin código ni dependencias | Comprobado | Solo documentación; ninguna prueba técnica o instalación ejecutada |
| 16. Pendientes de aprobación humana | Comprobado | Todas las TD permanecen PROPUESTA — PENDIENTE DE APROBACIÓN; no se actualiza registro de producto |

Esta lista verifica la entrega documental, no declara aprobada la arquitectura ni cumplidos los criterios de aceptación de la V1 implementada. No se avanza a M0.3.

### 12.1 Estado tras la corrección

La candidata global permanece sin cambios. React/Vite, TypeScript, NestJS principal, PostgreSQL, monolito modular y separación IA/transacciones son recomendaciones aceptables, **sujetas a aprobación final**. Versiones exactas y composición, Prisma/adaptador/SQL, pg-boss/outbox, módulos/runner, aislamiento concreto y toda decisión dependiente de P0, contrato o proveedor continúan provisionales. Auth0, Keycloak, Vercel, Render, AWS, Supabase, Meta directo/proveedor autorizado, OpenAI/Azure y PayPhone/Kushki son alternativas o candidatos; **ninguno queda definitivamente seleccionado**.

La revisión se limitó a los tres Markdown de arquitectura. Las huellas de los documentos originales del producto se contrastan de nuevo con sección11; se conservan intactos. Todas las pruebas VT siguen NO EJECUTADAS; no hubo instalaciones, código de aplicación, configuraciones, servicios contratados o nuevos archivos. No se inicia M0.3.
