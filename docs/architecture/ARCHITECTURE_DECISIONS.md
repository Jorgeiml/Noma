# M0.3 — Decisiones de arquitectura de alto nivel

Fecha: 26 de octubre de 2026, Ecuador. Versión: 0.1. Referencias: [arquitectura](ARCHITECTURE.md), [límites](MODULE_BOUNDARIES.md), [recorridos](RUNTIME_FLOWS.md) y documentos originales M0.1/M0.2 enlazados allí.

## 1. Estados y precedencia

**APROBADA POR INSTRUCCIÓN EXPRESA** se usa únicamente para NestJS y TypeScript como backend (ADR-001). **BASE CONSERVADA POR ENCARGO** identifica tecnologías y enfoque que el desarrollador ordena mantener, sin aprobar composición, proveedor ni detalles nuevos (ADR-002). **PROPUESTA — PENDIENTE DE REVISIÓN** se aplica a las otras catorce decisiones. Una validación documental no aprueba implementación.

La nueva instrucción prevalece sobre el estado provisional del backend en M0.2. No se modifica ese registro histórico, no se reabre comparación contra .NET/FastAPI y no se declara resuelta toda OQ-ARC-01. Las preguntas P0/P1 y las validaciones de versiones/adapters permanecen explícitas. Un cambio de redacción en estos cuatro documentos no modifica el PRD.

## ADR-001 — Backend NestJS y TypeScript

- **Contexto:** el desarrollador eligió expresamente NestJS y TypeScript y desea profundizar en ese ecosistema, aunque conoce otro backend.
- **Alternativas:** la comparación de M0.2 queda como antecedente; no se evalúa sustituir el backend en M0.3.
- **Recomendación:** aplicar la decisión: NestJS/TypeScript como único backend principal; no backend Python secundario sin necesidad demostrada.
- **Justificación:** decisión humana explícita del encargo actual, independiente de un empate de puntuaciones anterior.
- **Consecuencias:** nuevos límites y recorridos usan NestJS; conservar11.2.8 como referencia de M0.2, Node24 LTS y las pruebas de composición pendientes. No se aprueba por extensión CLI, formato de módulos o proveedor.
- **Riesgos:** confundir elección de framework con conjunto instalado/validado o con garantía transaccional.
- **Requisitos afectados:** MOD-01 a MOD-12; RNF-10/11 y FR-MOD02-007.
- **Preguntas abiertas relacionadas:** OQ-ARC-01 queda parcialmente encaminada respecto de lenguaje/framework, no resuelta para todos los componentes; OQ-ARC-03.
- **Estado:** APROBADA POR INSTRUCCIÓN EXPRESA DEL DESARROLLADOR, limitada a backend NestJS/TypeScript.

## ADR-002 — Base conservada y separación API/trabajador

- **Contexto:** el encargo conserva React/Vite/TypeScript, PostgreSQL, monolito modular y las referencias corregidas de M0.2.
- **Alternativas:** no sustituir esta base ni fragmentar dominios en microservicios por defecto; se podrá revisar despliegue si existe evidencia posterior.
- **Recomendación:** panel SPA, API NestJS y trabajador persistente del mismo código base, con PostgreSQL principal. Prisma7 y pg-boss mantienen estado candidato.
- **Justificación:** continuidad con el trabajo previo y operación viable para un equipo pequeño.
- **Consecuencias:** referencias React19.3/Vite8/TS5.9, Nest11.2.8/Node24 LTS, PG18, Prisma7.10.1 y pg-boss12.38.0 sin inventar actualizaciones; API/trabajador separados no son doce microservicios. No se configura ningún entorno.
- **Riesgos:** asumir que el diagrama de procesos obliga a Docker o que una referencia de versión está probada; ESM/runner/driver/pools pendientes.
- **Requisitos afectados:** FR-MOD02-007, FR-MOD07-001, FR-MOD12-001; RNF-04/10/12.
- **Preguntas abiertas relacionadas:** OQ-ARC-01/02/03 y OQ-SEC-01.
- **Estado:** BASE CONSERVADA POR ENCARGO; composición y despliegue pendientes de validación/revisión.

## ADR-003 — Propietarios de dominio y dependencia acíclica

- **Contexto:** doce módulos funcionales necesitan colaborar sin acceso privado cruzado.
- **Alternativas:** repositorio/servicio global de negocio; dependencias bidireccionales con referencias diferidas; propietarios y contratos públicos.
- **Recomendación:** doce dominios lógicos y seis soportes agrupables, con grafo y matriz de MODULE_BOUNDARIES; interfaces públicas sin ORM expuesto.
- **Justificación:** una sola autoridad por capacidad, dinero, acuerdo, consentimiento, beneficio y control de conversación.
- **Consecuencias:** AGE lee OFE/EQU, MKT consulta CLI, SEC consulta PLA, RIA usa APP/CON y APP no invoca RIA; handlers superiores gestionan eventos sin imports inversos.
- **Riesgos:** loops causales de eventos o módulo APP que absorba reglas; revisar nuevas aristas y causas de eventos. No basta dibujar un DAG si repositorios lo eluden.
- **Requisitos afectados:** todos los MOD y FR; RNF-10/11.
- **Preguntas abiertas relacionadas:** OQ-PRO-02, OQ-AGE-01 y OQ-ARC-01.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-004 — Recorridos transversales y transacción local explícita

- **Contexto:** reserva con paquete, aplicación de anticipo o cambios operativos necesitan varios propietarios.
- **Alternativas:** cada dominio cambia datos ajenos; eventos para todo; coordinador de aplicación que llama interfaces y comparte unidad local.
- **Recomendación:** APP coordina casos delimitados, sin reglas duplicadas; propietarios participan en una unidad de trabajo opaca cuando se promete atomicidad conjunta.
- **Justificación:** evita ciclos sin sacrificar integridad inmediata dentro del monolito compartido.
- **Consecuencias:** no commits independientes anidados para reserva+sesión; no transacción abierta esperando modelo/pago/canal; efectos posteriores por outbox.
- **Riesgos:** repositorios privados expuestos a coordinador, transacción demasiado larga o resultado conjunto comunicado antes del commit.
- **Requisitos afectados:** FR-MOD02-002/003, FR-MOD05-006, FR-MOD09-002/003 y FR-MOD12-004.
- **Preguntas abiertas relacionadas:** OQ-AGE-01, OQ-PAY-01/04 y OQ-LOY-02.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-005 — Contexto tenant y autorización por operación

- **Contexto:** base compartida candidata; frontera del negocio y permisos definitivos pendientes.
- **Alternativas:** confiar en tenant del cliente; control solo en ORM; contexto resuelto y verificado en todas las entradas con defensa adicional candidata.
- **Recomendación:** resolver tenant desde identidad/membresía o conexión externa verificada; propagar actor, alcance, operación y causalidad; verificar de nuevo en worker/herramienta. Mantener RLS como defensa a validar, no barrera única.
- **Justificación:** errores de enrutamiento, pooling, contexto IA y soporte pueden cruzar negocios aunque la interfaz filtre por tenant.
- **Consecuencias:** archivos, notas, jobs y proyecciones aislados; roles limitados, contexto de conexión acotado, soporte excepcional auditable; sin proveedor de identidad definitivo.
- **Riesgos:** RLS eludida por privilegio/propietario, claves ajenas en relaciones, scope viejo, credenciales en jobs o pertenencia revocada no comprobada.
- **Requisitos afectados:** FR-MOD06-001/005/006, FR-MOD12-002/004/005; RNF-01/02/03/14.
- **Preguntas abiertas relacionadas:** OQ-PRO-02, OQ-SEC-01/02/03, OQ-EXP-03 y OQ-ARC-02; resolver frontera y seguridad antes de fijar diseño físico dependiente.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-006 — Agenda como autoridad única de capacidad

- **Contexto:** WhatsApp, teléfono, presencial y administración comparten profesionales y recursos.
- **Alternativas:** agenda por canal; comprobación previa/caché/mutex de proceso; validación final e invariantes persistentes comunes.
- **Recomendación:** toda confirmación, cambio o liberación pasa por AGE con coordinación transaccional PostgreSQL. Configuración relevante se revalida con OFE/EQU y no solo mediante eventos eventuales.
- **Justificación:** consulta previa no impide dos confirmaciones concurrentes; cambios de ausencia o duración también compiten con reservas.
- **Consecuencias:** solicitud/retención/confirmación separadas; expiración verificable en comando aunque el job se atrase; reagendamiento protege cita original ante fallo. Mecanismo físico de recurso exclusivo/capacidadN se definirá después.
- **Riesgos:** sobreventa por versión vieja, orden de bloqueos/deadlock, job como reloj único y supuesto arbitrario sobre preparación/traslado.
- **Requisitos afectados:** FR-MOD02-001 a FR-MOD02-008; FR-MOD03-002/004/005; FL-12/13/16/17.
- **Preguntas abiertas relacionadas:** OQ-AGE-01/02/03, OQ-PAY-01; resolver antes de garantías físicas, sin elegir duración de retención aquí.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-007 — Oferta y acuerdo versionado separados de dinero

- **Contexto:** servicios con precio fijo, desde, rango o sujeto a valoración; valoración agendada/directa, gratuita/pagada.
- **Alternativas:** un campo de precio final para todo; cotización mutable sin evidencia; conceptos versionados con autoridades separadas.
- **Recomendación:** OFE posee modalidad, valoración, precio confirmado, cotización y aceptación de versión; AGE posee atención; COB posee importe cobrado y aplicaciones.
- **Justificación:** confirmar precio no equivale a aceptación, cita o dinero recibido; desconocido no significa cero.
- **Consecuencias:** cambio antes de aceptación genera propuesta versionada, cambio después requiere gestión explícita del acuerdo; aceptación presencial/telefónica registra actor/evidencia; valoración puede originar cita posterior sin perder identidad.
- **Riesgos:** atribuir al modelo facultad de precio, tratar rango como garantía automática o contar valoración como tratamiento realizado.
- **Requisitos afectados:** FR-MOD04-002/006/007/008, FR-MOD02-008, FR-MOD05-003/006 y FR-MOD11-003/006; FL-18/19.
- **Preguntas abiertas relacionadas:** OQ-COM-02/03/04/05/06/07/08 y OQ-PAY-04; no fijar obligatoriedad, facultades, vigencia o descuento antes de sus decisiones.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-008 — Pago verificado no equivale a reserva confirmada

- **Contexto:** evidencia duplicada/tardía, anticipo conocido con total aún no confirmado y fallos externos parciales.
- **Alternativas:** callback confirma cita sin revalidar; bloquear DB durante checkout; persistir dinero y validar capacidad mediante aplicación posterior.
- **Recomendación:** COB verifica y conserva evidencia por ámbito/receptor; APP pide confirmación AGE con estado vigente y dinero autorizado. Solicitar/enlazar/cobrar/consultar/devolver son puertos externos no atómicos con DB.
- **Justificación:** un pago real no debe perderse porque falló la aplicación, y no otorga horario ocupado.
- **Consecuencias:** dinero puede quedar verificado pendiente de resolución; pagos parciales, diferencias y devoluciones preservan movimientos. Negocio→SaaS y cliente→negocio se separan; proveedor y recurrencia siguen pendientes.
- **Riesgos:** recobro tras timeout, evidencia no autenticada, doble aplicación, devolución informada como completada sin prueba o agregación de fondos asumida.
- **Requisitos afectados:** FR-MOD05-001 a FR-MOD05-006, FR-MOD12-003 y FL-12.
- **Preguntas abiertas relacionadas:** OQ-PAY-01/02/03/04, OQ-INT-02 y OQ-BIZ-03; validar medio/producto y políticas antes de dinero real.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-009 — Outbox, entrega repetible y trabajo durable

- **Contexto:** recordatorios, campañas, conciliación y métricas deben sobrevivir caída del web.
- **Alternativas:** temporizadores de proceso, doble escritura sin registro de intención, evento durable con outbox/cola y consumidores idempotentes.
- **Recomendación:** cambio+auditoría crítica+outbox atómicos localmente; despachador publica a pg-boss después y registra avance; worker revalida y ejecuta caso de uso autorizado.
- **Justificación:** compartir servidor PostgreSQL no une transacciones de Prisma y cola. Caída después de publicar puede repetir entrega y debe tolerarse.
- **Consecuencias:** se distingue evento, job, mensaje externo y estado de negocio; cancelar lógicamente trabajo obsoleto y no confiar solo en borrado de cola; límite/retraso de reintento configurables posteriormente.
- **Riesgos:** doble efecto externo incierto, identidad de job usada como única llave de negocio, saturación de conexiones y bucles causales. No exactamente una vez remoto.
- **Requisitos afectados:** FR-MOD07-001 a FR-MOD07-006, FR-MOD08-003, FR-MOD05-004 y RNF-04/12.
- **Preguntas abiertas relacionadas:** OQ-MKT-02, OQ-ARC-02/03 y validación de composición heredada de OQ-ARC-01.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-010 — IA como consumidor autorizado de aplicación

- **Contexto:** recepcionista recomienda e interpreta pero no define políticas ni verdad transaccional.
- **Alternativas:** agente con SQL/directorio global y poderes generales; herramientas específicas que invocan servicios autorizados.
- **Recomendación:** RIA usa CON para contexto y APP para herramientas; handler superior inicia generación, APP no depende de RIA. Modelo, orquestación, herramientas, aplicación y persistencia son responsabilidades distintas.
- **Justificación:** las mismas reglas rigen un empleado, una integración y una propuesta del modelo; agenda no depende de que el LLM esté disponible.
- **Consecuencias:** no SQL del modelo ni acceso directo a tablas; validar parámetros/tenant/permisos, causas y resultados; prompts versionados, contexto mínimo, límites y evaluaciones; LangGraph no obligatorio.
- **Riesgos:** inyección de instrucciones, contexto cruzado, herramienta repetida, costo/timeout, precio inventado y texto que anuncia éxito antes del commit.
- **Requisitos afectados:** FR-MOD01-001 a FR-MOD01-006, FR-MOD02-007, FR-MOD04-006/008 y RNF-13/15.
- **Preguntas abiertas relacionadas:** OQ-SEC-01/02, OQ-EXP-01, OQ-COM-06 y OQ-ARC-03; proveedor/modelo pendientes, sin aprobación por esta arquitectura.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-011 — Control humano, baja y puerta final de despacho

- **Contexto:** una respuesta puede estar generándose cuando humano toma control o cliente pide baja; canal externo no comparte commit local.
- **Alternativas:** flag de pausa en memoria, cancelar solo jobs programados, versionar control y coordinar último paso antes de envío con estado visible de intentos inciertos.
- **Recomendación:** CON posee control/versión de conversación y estado de salida; CLI posee consentimiento. APP revalida ambos y estado comercial al despachar. Una toma/baja que gana coordinación local impide nueva salida incompatible; generación o job reclamado no son despacho.
- **Justificación:** suprimir solo programación deja carreras con mensajes en preparación o trabajadores que ya reclamaron tarea.
- **Consecuencias:** cancelar lo no iniciado, revalidar lo todavía cancelable antes del I/O, persistir intento en vuelo/incierto y mostrarlo; resolver orden antes de respuesta incompatible. No retirar por promesa un mensaje aceptado por proveedor.
- **Riesgos:** AP-01: no hay atomicidad entre último control DB y red; mensaje iniciado puede llegar después de pausa/baja. Es límite identificado, no garantía resuelta. Falta acordar punto efectivo y UX de incertidumbre sin timeout arbitrario.
- **Requisitos afectados:** FR-MOD10-001 a FR-MOD10-005, FR-MOD06-005, FR-MOD08-004 y FR-MOD07-006.
- **Preguntas abiertas relacionadas:** OQ-EXP-01/04, OQ-MKT-01/02 y OQ-INT-01; resolver semántica/validación de carreras antes de activar envíos automáticos, manteniendo baja y control como autoridad.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN, con AP-01 explícito.

## ADR-012 — Reglas y campañas sin duplicar autoridad de contacto

- **Contexto:** AUT y MKT necesitan seguimientos, encuestas, recuperación, promociones y espera.
- **Alternativas:** motores independientes que envían directamente; un motor universal de toda lógica; planificación especializada con puerta de contacto común.
- **Recomendación:** AUT posee reglas/ejecuciones, MKT campaña/audiencia y CON despacho; APP coordina hechos vigentes y consulta CLI para contacto. Campaña no mantiene consentimiento que prevalezca sobre CRM.
- **Justificación:** audiencia/programación antigua no concede permiso actual; automatización se basa en estados verificables y puede suspenderse por humano.
- **Consecuencias:** jobs cancelados/obsoletos se suprimen con causa, frecuencia y prioridades comunes por definir; ausencia de WhatsApp/contacto no bloquea reserva manual. Encuesta/reseña sin respuesta no inventa satisfacción.
- **Riesgos:** duplicados entre campaña y seguimiento, promoción disfrazada de mensaje operativo o recordatorio tras cancelación.
- **Requisitos afectados:** FR-MOD06-005, FR-MOD07-001 a FR-MOD07-006, FR-MOD08-001 a FR-MOD08-005 y FR-MOD01-004.
- **Preguntas abiertas relacionadas:** OQ-MKT-01/02/03, OQ-EXP-01/02 y OQ-AGE-02; no fijar ventana, frecuencia o prioridad sin política.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-013 — Beneficios con autoridad de saldo y coordinación inmediata

- **Contexto:** la última sesión o recompensa no puede redimirse dos veces aunque solicitudes lleguen por canales distintos.
- **Alternativas:** descontar por evento eventual tras prometer cita; acceso a saldo desde agenda/marketing; FID como autoridad con coordinación local cuando el éxito es conjunto.
- **Recomendación:** FID gestiona movimientos, compromisos y consumos; APP coordina reserva+beneficio en unidad local si lo requiere la política. Acreditaciones posteriores pueden ser eventuales y deduplicadas.
- **Justificación:** una proyección de CRM no protege saldo; tampoco basta validar disponibilidad del horario si se prometió beneficio inexistente.
- **Consecuencias:** causa verificable y movimientos auditables, sin saldo negativo o doble acreditación; cancelar/restaurar según política y no borrar historia. Membresías de clientes y suscripción SaaS separadas.
- **Riesgos:** momento de consumo inventado, restitución repetida, cupón/promoción con cálculo distinto en varios módulos.
- **Requisitos afectados:** FR-MOD09-001 a FR-MOD09-005, FR-MOD02-002 y FR-MOD04-005.
- **Preguntas abiertas relacionadas:** OQ-LOY-01/02/03, OQ-COM-02/05 y OQ-PAY-03; cerrar reglas antes de programas activos.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-014 — Analítica eventual sin autoridad operacional

- **Contexto:** embudo, agenda, recurrencia, campañas y dinero se consultan con períodos y atribución.
- **Alternativas:** reportes privilegiados sobre datos privados sin límites; proyecciones autorizadas con hechos y reconstrucción controlada.
- **Recomendación:** ANA posee vistas derivadas por tenant, definiciones y avance; aplicar hechos públicos idempotentes; reconstruir mediante exportaciones de interfaces coordinadas, sin corregir fuentes desde reporte.
- **Justificación:** desacopla reportes y mantiene diferencia entre observación, atribución y estimación; retraso de vista no debe autorizar reserva o pago.
- **Consecuencias:** mostrar cobertura/actualización; precio orientativo, confirmado y cobrado separados; origen manual no atribuible automáticamente a IA y valoración no contada como tratamiento.
- **Riesgos:** evento fuera de orden o ausente, doble conteo de anticipos/valoración aplicada, proyección obsoleta presentada como saldo autoritativo.
- **Requisitos afectados:** FR-MOD11-001 a FR-MOD11-006 y FR-MOD06-004/006.
- **Preguntas abiertas relacionadas:** OQ-PRO-03/05, OQ-MKT-03, OQ-COM-08 y OQ-ARC-03; definir métricas antes de aceptación de reportes.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-015 — Puertos externos y operación independiente de proveedor

- **Contexto:** identidad, canal, pago, modelo, hosting y objetos continúan sujetos a validación; API/worker necesitan operación recuperable.
- **Alternativas:** proveedor concreto en cada módulo o puertos orientados a capacidades con adapters y evidencia de fallos.
- **Recomendación:** aislar servicios externos y objetos por puertos; separar entornos y secretos; logs/trazas redactados y auditoría comercial distinguida; backups/restauración de DB y objetos con conciliación externa.
- **Justificación:** decisiones comerciales y regiones no cerradas no deben contaminar reglas de reserva, precio, beneficio o contacto.
- **Consecuencias:** ningún proveedor seleccionado definitivamente; no Graph API ni tarifas fijadas. API/manual operan sin canal/modelo. Continuidad y consumo se medirán con objetivos aprobados; no APM pago o infraestructura contratada aquí.
- **Riesgos:** adapter que introduce reglas ocultas, secretos/datos personales en logs, disco efímero usado como respaldo, restauración que repite cobros o costos sin medición.
- **Requisitos afectados:** FR-MOD02-007, FR-MOD04-001, FR-MOD05-002, FR-MOD12-001/004/005 y RNF-06/08/12/13/14.
- **Preguntas abiertas relacionadas:** OQ-INT-01/02/03, OQ-SEC-01/02/03, OQ-BIZ-01/02/03 y OQ-ARC-02/03; validar antes de contratos/producción.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## ADR-016 — Puertas de validación antes del diseño físico y operación

- **Contexto:** alto nivel tiene límites pendientes de política, composición y garantías ejecutadas.
- **Alternativas:** declarar diseño listo para producción por documentación; bloquear toda documentación hasta resolver preguntas; documentar alcance y pruebas posteriores sin inventar decisiones.
- **Recomendación:** revisar ADR propuestos, resolver P0/P1 según dependencia y probar invariantes, fallos y carreras en etapa autorizada; no ejecutar M0.4 en esta entrega.
- **Justificación:** distinguir arquitectura propuesta de aprobación humana y de evidencia experimental protege alcance y trazabilidad.
- **Consecuencias:** pruebas de composición, aislamiento, reserva multicanal, pago tardío, cotización, beneficio, baja/pausa, outbox y restauración siguen pendientes; diagramas requieren validación sintáctica si hay herramienta existente, sin instalar dependencias.
- **Riesgos:** validar solo estructura de Markdown y presentarlo como test de sistema, o afirmar sintaxis Mermaid comprobada sin parser.
- **Requisitos afectados:** RNF-01 a RNF-15, criterios de aceptación de V1 y todos los recorridos críticos RF.
- **Preguntas abiertas relacionadas:** OQ-ARC-01/02/03 y todas las dependencias P0/P1 detalladas en ARCHITECTURE sección19.
- **Estado:** PROPUESTA — PENDIENTE DE REVISIÓN.

## 2. Registro de conservación de documentos anteriores

Huellas SHA-256 de entrada para verificar que M0.1 y M0.2 no cambiaron:

| Documento | SHA-256 |
| --- | --- |
| docs/product/PRD.md |552781790A718786D4C7177510691CABA812705D337C38A51F1EBB882094F004 |
| docs/product/OPEN_QUESTIONS.md |6BBC5A7BA773D711834031B085A32F1EB3DACCD9F32C523702225E447E125D07 |
| docs/architecture/TECH_STACK.md |E7958A7BCDEEB6A0D4E37231E1851143635F0BEB72572F10A0DAC077E44DC05E |
| docs/architecture/STACK_DECISIONS.md |5DC738CD890ECD44CB4EEB42BFCB0AFE80F117129D53ED19240F6B7CEA5CA2B1 |
| docs/architecture/STACK_VALIDATION.md |3CB7254F27D2317AAF04AE21D97A65A2786B9E33BBECDAD8B44781C88FE305AD |

## 3. Validación documental de los veinte criterios

Esta lista no equivale a aprobar la arquitectura o ejecutar pruebas funcionales. Los detalles físicos, código y servicios están fuera del alcance.

| Criterio | Resultado de revisión documental | Evidencia/límite |
| --- | --- | --- |
| 1. Lectura de las cinco entradas | Revisado | PRD, preguntas y última corrección de los tres documentos M0.2; conservar huellas |
| 2. NestJS elegido respetado | Cumplido | ADR-001; no nueva comparación para sustituirlo |
| 3. Doce módulos | Cumplido | Inventario de MODULE_BOUNDARIES cubre los71 FR por rangos completos |
| 4. Sin ciclos propuestos sin resolución | Revisado | Grafo de20 aristas comprobado acíclico por orden topológico, matriz revisada y resolución de ciclos explícita; dependencias de implementación aún no existen |
| 5. Agenda transaccional única | Cumplido en diseño | AGE en RF-01/02/03/08, sin mutex de proceso como garantía |
| 6. Manual sin WhatsApp/IA | Cumplido en diseño | RF-02, condiciones de operación y errores del canal |
| 7. Precio variable/valoración | Cumplido | OFE y RF-04; total sin definir no es cero |
| 8. IA no controla operaciones críticas | Cumplido | Herramientas APP y autoridades de dominio; no SQL del modelo |
| 9. Pago/cita separados | Cumplido | COB/AGE y RF-03/07; dinero puede quedar pendiente de aplicación |
| 10. Fallos, reintentos e idempotencia | Cumplido documentalmente | Trece RF incluyen error, reintento, compensación y deduplicación; no tests ejecutados |
| 11. Tenant en HTTP/webhook/worker | Cumplido en diseño | Cuatro rutas de contexto y alcance del principal; incluye herramientas IA/archivos |
| 12. Consentimiento al despachar | Cumplido con límite registrado | CLI autoritativo, RF-05/10 y AP-01 para intervalo con proveedor |
| 13. Suspensión humana | Cumplido con límite registrado | CON versionado, RF-06; mensaje en vuelo no se retira por promesa |
| 14. Diagramas y texto | Revisados | Cuatro flowcharts y ocho secuencias; externos fuera de TX y misma autoridad AGE |
| 15. Diagramas obligatorios | Incluidos |12 en total; contexto, procesos, módulos, tenant y seis secuencias obligatorias más tardío/concurrencia |
| 16. Pendientes identificados | Cumplido | Tabla P0/P1, AP-01 a04 y14 ADR nuevos propuestos; backend aprobado no cierra toda OQ-ARC-01 |
| 17. Originales intactos | Contrastado por huellas | Cinco SHA-256 de sección2 sin modificar documentos anteriores |
| 18. Sin código/infraestructura | Cumplido | Solo cuatro Markdown nuevos; sin dependencias, repositorio o despliegue |
| 19. Cuatro documentos | Cumplido | ARCHITECTURE, MODULE_BOUNDARIES, RUNTIME_FLOWS y este registro |
| 20. Mantenible por equipo pequeño | Revisado como juicio arquitectónico | Un código base, API/worker, doce autoridades y seis soportes agrupables; no microservicios ni proveedor añadido obligatorio; validar comprensión con desarrollador |

### Validación Mermaid

Se revisaron manualmente etiquetas, participantes, direcciones, bloques de secuencia y correspondencia con texto, y se comprobaron estructura de cercas y referencias documentales. No se localizó CLI `mmdc` ni paquete/parser Mermaid en el proyecto o las dependencias compartidas consultadas, incluida búsqueda de dependencias anidadas. **Validación sintáctica automatizada y renderizado Mermaid: PENDIENTES.** No se instalaron dependencias ni se generó un archivo de prueba. La revisión manual y el análisis del grafo de dependencias no se presentan como sustitutos de un parser Mermaid.

## 4. Estado al terminar

No se generaron archivos fuera de los cuatro autorizados, código de aplicación, schemas, migraciones, endpoints, configuraciones, Dockerfiles o infraestructura. No se instalaron dependencias, inicializó repositorio o ejecutó despliegue. La elección humana de NestJS se respeta, las nuevas decisiones requieren revisión y M0.4 no se inicia.
