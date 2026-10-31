# M0.2 — Registro de decisiones tecnológicas propuestas

Fecha de revisión: **26 de octubre de 2026, Ecuador**. Versión: 0.2 — compatibilidad y estados de revisión. Todas las decisiones conservan estado **PROPUESTA — PENDIENTE DE APROBACIÓN**. Se distingue abajo dirección arquitectónica aceptable de decisiones provisionales; ninguna equivale a aprobación final. Una recomendación no resuelve las preguntas del producto ni autoriza implementación, configuración o contratación.

Referencias: [análisis y matriz](TECH_STACK.md), [evidencia y validación pendiente](STACK_VALIDATION.md), [PRD intacto](../product/PRD.md) y [preguntas originales intactas](../product/OPEN_QUESTIONS.md). Las justificaciones son inferencias técnicas; versiones y capacidades publicadas se verifican en el registro de fuentes. No se han ejecutado pruebas de los stacks.

### Estado de revisión, sin aprobación final

| Dirección o decisión | Clasificación de revisión | Alcance que sigue sin aprobar |
| --- | --- | --- |
| Monolito modular con API y trabajador separados — TD-001 | RECOMENDACIÓN ACEPTABLE — SUJETA A APROBACIÓN FINAL | Despliegue, reparto de carga y recuperación concretos |
| React + Vite y TypeScript — TD-002 | RECOMENDACIÓN ACEPTABLE — SUJETA A APROBACIÓN FINAL | Parches, plugins, bibliotecas visuales, compilador y pruebas de interfaz |
| NestJS como backend principal y TypeScript — TD-003 | RECOMENDACIÓN ACEPTABLE — SUJETA A APROBACIÓN FINAL | Referencia Nest11.2.8/Node24 LTS; CLI, paquetes, formato de módulos y pruebas integradas |
| PostgreSQL — TD-004 | RECOMENDACIÓN ACEPTABLE — SUJETA A APROBACIÓN FINAL | Rama18 candidata, parche, proveedor, restricciones y recuperación según P0 |
| IA separada de reglas transaccionales — principio de TD-009 | RECOMENDACIÓN ACEPTABLE — SUJETA A APROBACIÓN FINAL | SDK, orquestación exacta, proveedor/modelo, herramientas, evaluaciones y datos |
| Prisma7, SQL específico y adaptador — TD-005 | PROVISIONAL — PENDIENTE DE VALIDACIÓN Y APROBACIÓN | Composición de cliente/CLI/adaptador/controlador, pool, RLS y SQL crítico |
| pg-boss y outbox — TD-008 | PROVISIONAL — PENDIENTE DE VALIDACIÓN Y APROBACIÓN | ESM, dependencias/peers, atomicidad local de outbox, reintentos y fallos |
| Aislamiento, identidad, proveedor IA/canal/pago, hosting y operación — TD-006/007/010 a 016 | PROVISIONAL — PENDIENTE DE VALIDACIÓN Y APROBACIÓN | Preguntas P0, integración, contratos, región, seguridad, carga y continuidad |

La calificación de principio aceptable en TD-009 no aprueba su biblioteca de ejecución. Node24 LTS permanece como runtime candidato principal; cumplir mínimos publicados no aprueba un ensamblaje completo. No hay selección definitiva de proveedor de autenticación, hosting, Meta o pagos. La comparación A/B/C previa se mantiene; esta revisión no cambia pesos ni puntuaciones.

## TD-001 — Monolito modular con proceso web y trabajador

- **Contexto:** doce módulos relacionados y equipo inicialmente de una persona.
- **Problema:** coordinar datos y trabajo durable sin multiplicar servicios y despliegues de negocio.
- **Alternativas:** monolito modular; microservicios por dominio; aplicación exclusivamente de funciones de corta duración.
- **Decisión recomendada:** un backend modular con procesos web y trabajadores separados, compartiendo reglas y límites de dominio; frontend separado.
- **Justificación:** reduce coordinación operativa y conserva capacidad de aislar trabajo asíncrono sin fragmentar transacciones del negocio.
- **Ventajas:** menos piezas, recorridos integrados y pruebas de reglas únicas para panel e IA.
- **Desventajas:** exige disciplina de límites internos; despliegues de módulos aún coordinados.
- **Consecuencias:** no habrá doce APIs independientes ni backend Python secundario sin necesidad demostrada; procesos separados no equivalen a microservicios.
- **Riesgos:** acoplamiento interno y contención; revisar con medidas de carga y fallos.
- **Requisitos del PRD afectados:** MOD-01 a MOD-12; FR-MOD02-007, FR-MOD07-001, RNF-10 y RNF-12.
- **Preguntas abiertas relacionadas:** OQ-ARC-01, OQ-ARC-02, OQ-ARC-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-002 — Panel SPA con React, Vite y TypeScript

- **Contexto:** agenda, CRM, bandeja, formularios y reportes autenticados con interacción continua.
- **Problema:** elegir renderizado y herramientas sin asumir SSR obligatorio para todo el SaaS.
- **Alternativas:** Next.js con TypeScript; React con Vite y TypeScript; renderizado de servidor selectivo si se justifica después.
- **Decisión recomendada:** SPA con React 19.3 y Vite 8 como familias verificadas; TypeScript 5.9 como base propuesta, revisando compatibilidad antes de fijar parches.
- **Justificación:** el PRD no exige indexación del panel; una salida estática reduce responsabilidades del servidor de interfaz.
- **Ventajas:** separación explícita con backend y hosting estático intercambiable.
- **Desventajas:** router, estado remoto, formularios y accesibilidad requieren selección posterior; carga inicial del cliente.
- **Consecuencias:** disponibilidad final se valida en backend, nunca por estado local o caché; Next queda disponible para necesidades reales de SSR o contenido público.
- **Riesgos:** bibliotecas de agenda/tablas, licencias, React y plugins no probados juntos; probar teclados y empleados con poca familiaridad tecnológica.
- **Requisitos del PRD afectados:** FR-MOD02-006 y 007, FR-MOD06-001, FR-MOD10-001, FR-MOD11-006, RNF-07.
- **Preguntas abiertas relacionadas:** OQ-EXP-03, OQ-EXP-05, OQ-ARC-01 y OQ-ARC-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-003 — NestJS y TypeScript como backend principal

- **Contexto:** gran cantidad de lógica determinista; la IA es una integración.
- **Problema:** elegir un backend mantenible sin crear dos lenguajes de servidor por conveniencia de bibliotecas IA.
- **Alternativas:** NestJS/TypeScript; FastAPI/Python; ASP.NET Core/C#.
- **Decisión recomendada:** mantener NestJS11.2.8 como versión candidata con Node24 LTS; el enlace oficial de última release volvió a resolver a v11.2.8. Confirmar mantenimiento y parches antes de fijar paquetes; no añadir backend Python.
- **Justificación:** módulos y ruta de trabajadores coherentes con un lenguaje principal. La matriz da A 4,24, C 4,19 y B 4,05, con incertidumbre explícita; C puede ganar si existe experiencia .NET.
- **Ventajas:** convenciones modulares y menos cambios de contexto entre panel y backend.
- **Desventajas:** event loop vulnerable a trabajo bloqueante; tipos no reemplazan validaciones en ejecución ni reglas monetarias.
- **Consecuencias:** el desarrollador debe aprobar conociendo su experiencia; compartir TypeScript no autoriza compartir entidades internas o eliminar contratos. El rango Node>=20 del core etiquetado admite24, pero no certifica CLI, adaptador HTTP, compilación ni runner. Preservar paquetes Nest de major11 y verificar el formato de módulos elegido.
- **Riesgos:** documentación general ya describe Nest12; no mezclar features, CLI o paquetes de otra major ni presentar12 como estable solo por esa guía. No se ha encontrado evidencia documental bloqueante contra11.2.8/24, pero no se declara ausencia de errores ni soporte LTS para Nest. Node20 mínimo histórico no es recomendación de producción.
- **Requisitos del PRD afectados:** FR-MOD01-005, FR-MOD02-002, FR-MOD05-002, FR-MOD07-001, FR-MOD12-004; RNF-04 y RNF-10.
- **Preguntas abiertas relacionadas:** OQ-ARC-01 y OQ-ARC-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-004 — PostgreSQL como autoridad transaccional

- **Contexto:** capacidad simultánea, relaciones complejas, dinero y beneficios.
- **Problema:** conservar integridad bajo concurrencia y fallos, no solo en el camino ideal de UI.
- **Alternativas:** PostgreSQL; MySQL/MariaDB; SQL Server; motores no relacionales o distribuidos sin necesidad demostrada.
- **Decisión recomendada:** PostgreSQL18 administrado y parche seguro disponible; 18.6 verificado documentalmente, sin usar 19 RC.
- **Justificación:** transacciones, restricciones, rangos y RLS documentados encajan con el producto; no hay requisito que justifique otro motor inicialmente.
- **Ventajas:** consistencia local, SQL relacional y consultas comerciales en un motor.
- **Desventajas:** diseñar bloqueos, restricciones e índices exige cuidado; un punto de contención y recuperación compartido.
- **Consecuencias:** backend aplica políticas y DB respalda invariantes; no habrá transacciones abiertas esperando pago o LLM. Modelo físico se define en etapa posterior.
- **Riesgos:** serialización/deadlocks requieren manejo y reintentos; exclusión temporal no resuelve capacidad N por sí sola; backups necesitan restauración probada.
- **Requisitos del PRD afectados:** FR-MOD02-001 a 003, FR-MOD03-004, FR-MOD05-003, FR-MOD09-002 y 003, FR-MOD11-003, RNF-05 y RNF-12.
- **Preguntas abiertas relacionadas:** OQ-AGE-01, OQ-PAY-01, OQ-LOY-02, OQ-ARC-02.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-005 — Prisma con SQL específico revisado

- **Contexto:** operaciones ordinarias de doce módulos y capacidades PostgreSQL no representadas completamente por un ORM.
- **Problema:** equilibrar productividad, tipado y control transaccional.
- **Alternativas:** Prisma; Drizzle; solo SQL; SQLAlchemy en B; EF Core/Npgsql en C.
- **Decisión recomendada:** Prisma7.10.1 como referencia provisional, SQL parametrizado donde haga falta y adaptador PostgreSQL compatible para conexión directa; no adoptar Prisma8 RC ni dos ORMs en paralelo.
- **Justificación:** documentación versionada respalda transacciones y PG18; SQL específico conserva posibilidades de DB sin imponer un esquema aquí.
- **Ventajas:** cliente tipado y convenciones comunes para acceso ordinario.
- **Desventajas:** restricciones y políticas avanzadas requieren revisión adicional; generación y cambios de herramientas deben controlarse.
- **Consecuencias:** la prueba posterior verificará cliente, CLI, `@prisma/adapter-pg`, controlador y su ciclo de conexiones, además de SQL específico, transacciones, pooling y RLS. Generador, compilador y runtime deben usar formato de módulos coherente. ESM es preferencia provisional; Prisma7 también permite cliente CommonJS, por lo que no se impone ESM por supuesta obligación del ORM. Si existe fricción estructural, Drizzle0.45.4 es sustituto evaluable antes de expandir implementación.
- **Riesgos:** confundir docs8 con7, mezclar cliente ESM con salida CommonJS sin resolver imports/runner, perder elementos manuales al evolucionar datos o ejecutar con tenant incorrecto; ningún ORM evita por sí solo reservas duplicadas. No basta el rango del motor para demostrar comportamiento de consultas y restricciones.
- **Requisitos del PRD afectados:** FR-MOD02-002, FR-MOD05-003 y 006, FR-MOD09-002, FR-MOD12-004.
- **Preguntas abiertas relacionadas:** OQ-AGE-01, OQ-SEC-03, OQ-ARC-01.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-006 — Base compartida y defensa de aislamiento por capas

- **Contexto:** negocios separados, sucursales e identidad comercial pendientes de definición final.
- **Problema:** impedir lectura y modificación cruzadas con operación viable para un ingeniero.
- **Alternativas:** base compartida con tenant_id; schema por tenant; base por tenant.
- **Decisión recomendada:** base compartida, contexto de tenant comprobado, autorización por operación y RLS adicional; no fijar frontera comercial pendiente.
- **Justificación:** menor carga de migraciones y conexiones, con obligaciones de pruebas explícitas. Un contrato que exija separación dedicada puede cambiar la decisión.
- **Ventajas:** administración inicial concentrada y consultas ordinarias simples.
- **Desventajas:** mayor impacto potencial de error común y dificultad de restauración selectiva por tenant.
- **Consecuencias:** roles de ejecución limitados, contexto transaccional sin fugas de pool y aislamiento de archivos, jobs y contexto IA; no basta filtrar consultas del ORM.
- **Riesgos:** propietarios/superusuarios pueden eludir RLS; relaciones y errores pueden filtrar información; migraciones y soporte requieren identidades separadas.
- **Requisitos del PRD afectados:** FR-MOD06-001 y 006, FR-MOD12-002, 004 y 005; RNF-01 a 03.
- **Preguntas abiertas relacionadas:** OQ-PRO-02, OQ-SEC-01, OQ-SEC-03, OQ-ARC-02.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-007 — Identidad administrada y autorización propia

- **Contexto:** propietarios, empleados, profesionales y soporte tienen alcances diferentes; clientes no son empleados.
- **Problema:** gestionar login y recuperación sin delegar autorización de datos al proveedor de identidad.
- **Alternativas:** OIDC administrado con Auth0 candidato; Keycloak autogestionado; identidad integrada evaluada en stack específico.
- **Decisión recomendada:** preferir OIDC administrado para personal, proveedor contractual provisional; backend mantiene membresías, capacidades y alcance de sucursal/tenant.
- **Justificación:** reduce operación propia de identidad sin tratar organizaciones de un proveedor como aislamiento automático de datos.
- **Ventajas:** separación de responsabilidades y estándares de autenticación.
- **Desventajas:** costo, límites de organizaciones, dependencia y diseño de sesiones/revocación por resolver.
- **Consecuencias:** verificar identidad, sesión y permisos vigentes; acceso de soporte limitado y auditable. Clientes de teléfono/local no necesitan WhatsApp ni OIDC para su reserva manual.
- **Riesgos:** revocación tardía, callbacks o cookies incorrectos y acceso excesivo de soporte; comprobarlos antes de producción.
- **Requisitos del PRD afectados:** FR-MOD02-006, FR-MOD06-001, FR-MOD12-002 y 005; RNF-01, RNF-14.
- **Preguntas abiertas relacionadas:** OQ-SEC-01, OQ-SEC-03, OQ-EXP-03, OQ-BIZ-02.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-008 — pg-boss, outbox y trabajadores durables

- **Contexto:** recordatorios, campañas, webhooks y procesos prolongados sobreviven reinicios.
- **Problema:** no perder intención de trabajo entre guardar una operación y programar su procesamiento.
- **Alternativas:** pg-boss; BullMQ/Redis; Celery/broker en B; Quartz/PostgreSQL en C; cola administrada.
- **Decisión recomendada:** pg-boss12.38.0 con outbox transaccional y despachador idempotente; trabajador separado del web, sin Redis obligatorio inicial.
- **Justificación:** evita broker adicional, manteniendo trabajo persistido; dos librerías conectadas a PostgreSQL no comparten transacción automáticamente.
- **Ventajas:** menos servicios iniciales y reanudación observable.
- **Desventajas:** competencia por recursos con el negocio; mantenimiento y retención de cola necesitan control.
- **Consecuencias:** entrega/reintento al menos una vez con deduplicación de efectos; tareas obsoletas revalidan cita, cotización, baja y control humano antes de actuar. El manifiesto12.38.0 declara ESM, Node>=22.12 y peer `@opentelemetry/api` ^1.9.0; Node24.22.1 cumple el rango, sin certificar su carga con Prisma. Resolver dependencias/peers no obliga a desplegar un servicio de observabilidad adicional. Compartir servidor PostgreSQL no comparte conexión ni transacción: outbox y datos deben confirmarse juntos localmente, con entrega posterior recuperable.
- **Riesgos:** publicación repetida, caída después de efecto externo o timeout sin resultado; consultar/conciliar antes de repetir cobro o envío. No se promete exactamente una vez extremo a extremo.
- **Requisitos del PRD afectados:** FR-MOD05-004, FR-MOD07-001 a 006, FR-MOD08-003 y 004; RNF-04 y RNF-12.
- **Preguntas abiertas relacionadas:** OQ-MKT-01, OQ-MKT-02, OQ-PAY-01, OQ-ARC-02 y OQ-ARC-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-009 — IA mediante herramientas restringidas y orquestación explícita

- **Contexto:** atención comercial contextual y control humano, sin delegar verdad financiera o disponibilidad al modelo.
- **Problema:** integrar generación de texto de forma recuperable sin convertirla en autoridad de operaciones.
- **Alternativas:** SDK del proveedor y flujo explícito; LangGraph; AI SDK u otra abstracción madura.
- **Decisión recomendada:** SDK oficial TypeScript y herramientas autorizadas; contexto persistido bajo control del producto y prompts versionados; no LangGraph obligatorio.
- **Justificación:** el recorrido conocido no demuestra todavía necesidad de un framework de grafos; la base determinista y los trabajos ya gestionan estados del negocio.
- **Ventajas:** menos capas, diagnóstico directo y permisos comunes con panel.
- **Desventajas:** recuperación, límites y evaluación deben diseñarse de forma explícita.
- **Consecuencias:** validar herramientas antes de ejecutar y comunicar solo resultados comprobados; errores o revisión humana no se resuelven inventando respuesta comercial.
- **Riesgos:** alucinación semántica aun con JSON válido, inyección de instrucciones y filtración de contexto; evaluaciones, minimización y pruebas por tenant. Checkpoint de agente no reemplaza transacción de negocio.
- **Requisitos del PRD afectados:** FR-MOD01-001 a 006, FR-MOD04-006 y 008, FR-MOD10-003 y 005; RNF-15.
- **Preguntas abiertas relacionadas:** OQ-SEC-01, OQ-EXP-01, OQ-COM-06, OQ-ARC-01.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-010 — Acceso a modelos por adaptador, sin modelo aprobado

- **Contexto:** OpenAI directo y Azure OpenAI tienen superficies, gobierno y condiciones propias.
- **Problema:** elegir acceso sin asumir paridad regional, precio o retención universal.
- **Alternativas:** OpenAI; Azure OpenAI; otro proveedor evaluado después si existe motivo.
- **Decisión recomendada:** OpenAI directo como candidato inicial de prueba documental; proveedor y modelo finales pendientes de evaluación representativa y tratamiento de datos.
- **Justificación:** SDK TypeScript y herramientas documentadas; Azure es alternativa si región, identidad o contratos lo justifican.
- **Ventajas:** frontera sustituible y selección por tareas reales del segmento.
- **Desventajas:** abstraer no elimina diferencias de modelos, cuotas, funciones o despliegues.
- **Consecuencias:** medir calidad comercial, español, latencia, tokens, errores y derivación; conservar historial del producto fuera de una sesión exclusiva del proveedor.
- **Riesgos:** cambios de modelo, costo de contexto, acceso por cuenta y transferencia/retención de datos; sin decisión de residencia ni promesa de retención cero.
- **Requisitos del PRD afectados:** FR-MOD01-002, 005 y 006, FR-MOD12-004; RNF-02 y RNF-13.
- **Preguntas abiertas relacionadas:** OQ-SEC-01, OQ-SEC-02, OQ-BIZ-02, OQ-ARC-02 y OQ-ARC-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-011 — WhatsApp como adaptador independiente de agenda

- **Contexto:** recepción digital y atención humana conviven con reservas telefónicas/presenciales.
- **Problema:** habilitar WhatsApp multiempresa sin obligar a todos los negocios a depender del canal.
- **Alternativas:** Cloud API directa; proveedor autorizado; operación manual sin conexión hasta habilitarla.
- **Decisión recomendada:** Cloud API directa provisional, sujeta a validar incorporación, números, permisos y soporte; proveedor autorizado si simplifica operación justificada.
- **Justificación:** menor intermediación potencial, sin afirmar menor costo total ni factibilidad aprobada de múltiples comercios.
- **Ventajas:** control del adaptador y misma lógica de reserva para todos los canales.
- **Desventajas:** carga de incorporación y soporte del canal; documentación técnica parcialmente inaccesible en esta consulta.
- **Consecuencias:** cola y estados de mensajes separados de citas; baja, consentimiento y toma humana revalidados antes de enviar; manual sigue disponible sin IA/WhatsApp.
- **Riesgos:** 429/acceso restringido en documentación, reglas cambiantes, portabilidad del número y cobros por categoría/mercado; no prometer promociones libres o mensajes gratuitos.
- **Requisitos del PRD afectados:** FR-MOD01-001, FR-MOD02-006 y 007, FR-MOD07-006, FR-MOD08-003, FR-MOD10-003, FR-MOD12-001.
- **Preguntas abiertas relacionadas:** OQ-INT-01, OQ-MKT-01, OQ-EXP-04, OQ-ARC-02.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-012 — Integración de pagos provisional y conciliable

- **Contexto:** Ecuador, múltiples negocios, anticipos, pagos parciales y cobros SaaS separados.
- **Problema:** seleccionar medio verificable sin asumir habilitación de recurrencia o devoluciones por existir una API.
- **Alternativas:** PayPhone; Kushki; proveedor alternativo validado; medios manuales autorizados según reglas del producto.
- **Decisión recomendada:** adaptador único de negocio con evaluación inicial de PayPhone Link frente a Kushki; proveedor final pendiente. No asumir mismo proveedor para cobros SaaS y cobros de cada negocio.
- **Justificación:** documentación local disponible, pero quedan autorizaciones, evidencia, conciliación y condiciones comerciales sin verificar completamente.
- **Ventajas:** flexibilidad ante contrato o producto de pago no disponible y manejo uniforme de estados locales.
- **Desventajas:** trabajo propio de evidencia, consulta, idempotencia y revisión de excepciones.
- **Consecuencias:** confirmar fuente/importe/moneda/comercio/operación; pagos tardíos no recuperan horario ocupado; un anticipo conocido no exige conocer el total final. Separar valoración, cotización aceptada y dinero recibido.
- **Riesgos:** Notificación Externa PayPhone requiere autorización; mecanismo íntegro de autenticidad y condiciones de producto deben verificarse; tokenización no acredita recurrencia automática. No integrar dinero real en esta etapa.
- **Requisitos del PRD afectados:** FR-MOD04-008, FR-MOD05-001 a 006, FR-MOD09-004, FR-MOD11-003, FR-MOD12-003; FL-12, FL-18 y FL-19.
- **Preguntas abiertas relacionadas:** OQ-INT-02, OQ-PAY-01 a 04, OQ-COM-05, OQ-COM-08, OQ-LOY-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-013 — Procesos persistentes y servicios administrados

- **Contexto:** un ingeniero necesita operar web, trabajos y datos sin administrar un clúster complejo.
- **Problema:** elegir ruta de despliegue que no confunda límites de funciones HTTP con trabajadores persistentes.
- **Alternativas:** estático Vercel o equivalente y servicios persistentes Render; Supabase como alternativa de datos/servicios; AWS Fargate/RDS/S3 con mayor control.
- **Decisión recomendada:** ruta administrada con backend y trabajador persistentes y PostgreSQL en región común; Render candidato; hosting estático y objetos sustituibles, proveedor/región/plan pendientes.
- **Justificación:** reduce operación de servidores; disponibilidad y recuperación requeridas pueden cambiar esta propuesta.
- **Ventajas:** componentes con responsabilidades claras y despliegue sin Kubernetes obligatorio.
- **Desventajas:** dependencia de planes, regiones, networking y exportación de proveedores; varios servicios siguen teniendo costo.
- **Consecuencias:** separar development, staging y production; secretos protegidos, objetos privados, conexión DB restringida, versiones controladas y restauración aislada.
- **Riesgos:** no haber medido latencia desde Ecuador, permisos/extensiones desconocidos y costos variables sin perfil de uso; no aprobar proveedor hasta cerrarlos.
- **Requisitos del PRD afectados:** FR-MOD02-007, FR-MOD04-001, FR-MOD12-004; RNF-06, RNF-12, RNF-13 y RNF-14.
- **Preguntas abiertas relacionadas:** OQ-SEC-01, OQ-ARC-02, OQ-ARC-03 y OQ-BIZ-02.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-014 — Pruebas de invariantes antes de operación real

- **Contexto:** fallos de agenda, pagos, aislamiento y beneficios son más graves que una demostración visual incompleta.
- **Problema:** comprobar recorridos críticos localmente y en CI con evidencias reproducibles.
- **Alternativas:** pruebas solo de UI/mocks; pruebas por capas con PostgreSQL real y proveedores simulados; validación manual sin regresión automatizada.
- **Decisión recomendada:** Vitest/Testing Library en panel, Jest/utilidades Nest en backend, Playwright E2E y pruebas PostgreSQL reales; análisis estático, formato y revisión de dependencias.
- **Justificación:** mocks no reproducen locks, RLS ni concurrencia; fixtures evitan usar credenciales y dinero real al validar dominio.
- **Ventajas:** fallos repetibles, posibilidad de ejecución por Codex y cobertura de casos negativos.
- **Desventajas:** preparar entornos y datos aislados; librerías/transformadores aún no probados juntos.
- **Consecuencias:** demostrar manual sin IA/WhatsApp, FL-12/13, valoración, pagos parciales, baja y última sesión concurrente antes de usar dinero real; no equivale a certificación de proveedor.
- **Riesgos:** falsa confianza por SQLite, por rollback único que oculta concurrencia o por E2E con LLM no controlado; usar pruebas adecuadas y evaluaciones separadas. Jest, transformador de decoradores, formato del cliente Prisma y módulos del trabajador permanecen provisionales; el mínimo de Node no prueba su interoperabilidad.
- **Requisitos del PRD afectados:** FR-MOD02-002, 006 a 008, FR-MOD05-004 y 006, FR-MOD08-004, FR-MOD09-003, FR-MOD12-004; RNF-11.
- **Preguntas abiertas relacionadas:** OQ-AGE-01, OQ-PAY-04, OQ-EXP-05, OQ-ARC-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-015 — Observabilidad, recuperación y control de consumo

- **Contexto:** acciones externas y trabajos pueden quedar inciertos o repetirse; cada tenant genera consumo variable.
- **Problema:** detectar y resolver fallos sin filtrar información privada ni asumir que un backup basta.
- **Alternativas:** logs ad hoc; logs estructurados y señales OpenTelemetry/servicio administrado; plataforma operativa compleja desde inicio.
- **Decisión recomendada:** correlación de operaciones, métricas y alertas accionables, trazas de componentes estables verificados; recuperación de DB/objetos y conciliación externa probadas posteriormente.
- **Justificación:** permite rastrear pago, reserva, mensaje y beneficio sin almacenar toda conversación en telemetría.
- **Ventajas:** incidentes explicables y consumo de tokens/mensajes atribuible al tenant.
- **Desventajas:** retención, almacenamiento, alertas y ejercicio de restauración tienen costo y mantenimiento.
- **Consecuencias:** no fijar RPO/RTO, SLA ni límites de uso arbitrarios; instrumentar cola, fallos y pagos inciertos; backup no restaura por sí solo estados externos ni archivos.
- **Riesgos:** datos personales en trazas, alarma excesiva, costos de observabilidad y repetir efectos tras restauración; políticas y ejercicios deben cerrarse.
- **Requisitos del PRD afectados:** FR-MOD05-005, FR-MOD07-001, FR-MOD11-005, FR-MOD12-004; RNF-08, RNF-12, RNF-13.
- **Preguntas abiertas relacionadas:** OQ-SEC-02, OQ-BIZ-02, OQ-ARC-02 y OQ-ARC-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## TD-016 — Versiones estables y cambios documentales controlados

- **Contexto:** páginas generales pueden describir una major distinta de la última release estable identificada.
- **Problema:** evitar un stack aparentemente compatible que mezcla mínimos, documentación y funciones de versiones distintas.
- **Alternativas:** adoptar `latest` sin contraste; anclar versiones estables y probar composición; introducir RC como dependencia fundamental.
- **Decisión recomendada:** usar releases estables y documentación anclada; resolver conjunto exacto y soporte vigente antes de implementación; no adoptar Nest12 por guía general, Prisma8 RC, Drizzle1 RC ni PostgreSQL19 RC como base obligatoria.
- **Justificación:** la investigación detectó divergencias concretas; seleccionar una versión no es probarla ni garantizarle soporte futuro.
- **Ventajas:** decisiones auditables y ruta de actualización consciente.
- **Desventajas:** revalidación de documentación, parches y dependencias antes de empezar y durante mantenimiento.
- **Consecuencias:** mantener todas las TD propuestas; cerrar paquete de pruebas con runtimes y transiciones de soporte; cambiar recomendación si evidencia nueva lo exige.
- **Riesgos:** documentación móvil, fin de soporte de librerías sin política LTS y vulnerabilidades nuevas; fecha de consulta no es aprobación permanente.
- **Requisitos del PRD afectados:** RNF-01, RNF-04, RNF-10, RNF-11 y RNF-12; todos los módulos dependen de composición compatible.
- **Preguntas abiertas relacionadas:** OQ-ARC-01, OQ-ARC-02 y OQ-ARC-03.
- **Estado:** PROPUESTA — PENDIENTE DE APROBACIÓN.

## Condición de revisión

El desarrollador revisará la candidata principal A, la alternativa C, las dependencias P0 y la evidencia pendiente del registro de validación. Esta corrección conserva las recomendaciones aceptables y distingue sus versiones y detalles provisionales. Cualquier aprobación debe registrar alcance y condiciones posteriormente; este documento no la anticipa. No se alteran decisiones funcionales ni se resuelven preguntas en el registro original. No se instalaron dependencias, ejecutó código de aplicación o pruebas, ni se generaron configuraciones. M0.3 no se inicia.
