# PRD — Plataforma SaaS de belleza y bienestar

## 1. Información y estado del documento

| Campo | Valor |
| --- | --- |
| Identificador | M0.1 — Definición formal del producto |
| Versión | 0.2 — revisión M0.1: operación multicanal y precios variables |
| Fecha | 26 de octubre de 2026, Ecuador |
| Estado | Propuesta funcional documentada, pendiente de revisión del desarrollador |
| Mercado inicial | Ecuador |
| Idioma | Español |
| Nombre comercial | Pendiente; este documento usa «plataforma» |
| Referencia de decisiones | [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) |
| Próximo paso | M0.2, fuera del alcance de esta entrega |

Este PRD es la referencia funcional inicial. Recoge decisiones del encargo ya aprobadas; la revisión del documento no significa que las preguntas abiertas estén resueltas. No selecciona tecnologías ni proveedores, ni establece fechas de entrega, costos, presupuesto obligatorio o precios definitivos. El equipo comienza con un desarrollador asistido por Codex y podrá incorporar un segundo desarrollador.

**Clasificación:** V1 significa compromiso funcional del lanzamiento comercial; Futuro significa expansión excluida del lanzamiento; Pendiente identifica una variante, política o medida sin resolver. Un parámetro pendiente no elimina de V1 la capacidad funcional que lo necesita. No se debe activar una operación dependiente de una política sin que esta haya sido definida y validada.

**Identificadores:** MOD identifica módulos; FR requisitos funcionales; FL flujos; RN reglas; RNF requisitos no funcionales; MET indicadores; OQ preguntas abiertas. Las referencias son funcionales, no contratos técnicos ni un modelo físico de datos.

## 2. Resumen ejecutivo

La plataforma será un SaaS B2B para establecimientos de belleza, estética y bienestar no médico en Ecuador. Su propuesta es «Una recepcionista comercial con inteligencia artificial que convierte conversaciones en clientes, gestiona reservaciones y ayuda a que los clientes regresen mediante WhatsApp».

La V1 cubre el ciclo captación → conversión → reserva → pago → atención → poscita → fidelización → reactivación → recompra mediante doce módulos integrados. No se limita a una agenda con un chatbot. La cobertura aproximada del 90 % de las funciones prioritarias es una orientación del producto, no una medición validada ni un requisito cuantitativo de aceptación.

La IA interpreta, recomienda y propone. El sistema valida y registra operaciones críticas con reglas confiables; el personal conserva supervisión y control. La V1 incluye negocios con varios profesionales, sucursales, recursos compartidos y políticas propias, con aislamiento entre establecimientos independientes.

La operación comercial es multicanal: WhatsApp con IA y registro manual de reservas telefónicas y presenciales comparten agenda, CRM, pagos, fidelización y reportes. El establecimiento puede operar el panel sin habilitar WhatsApp ni IA, o mientras estos estén indisponibles. Los servicios admiten precio fijo, desde, rango o sujeto a valoración; una valoración presencial puede conducir a una reserva posterior con precio confirmado.

## 3. Visión del producto

Dar a pequeños y medianos establecimientos una operación comercial continua y coordinada: responder con información autorizada, encontrar disponibilidad real, cerrar una reserva con sus condiciones, registrar pagos y atención, y facilitar el regreso del cliente con comunicaciones pertinentes y autorizadas.

La conversación y el panel deben operar sobre el mismo estado del negocio. Una reserva realizada por una persona debe ser visible para la IA y viceversa; una baja promocional debe afectar campañas y seguimientos comerciales. La automatización debe poder explicar qué ocurrió y permitir intervención humana.

Los negocios que reciben principalmente llamadas o visitas al local no necesitan cambiar esos hábitos. El personal registra esas reservas en la misma agenda; la atención telefónica con IA no es requisito de V1. Una valoración en este producto es comercial y no médica, y nunca constituye diagnóstico ni historia clínica.

## 4. Problema y propuesta de valor

Se parte de hipótesis de problema por validar con establecimientos: conversaciones sin respuesta o sin seguimiento, agendas dispersas, conflictos de horarios, anticipos difíciles de verificar, inasistencias, información de clientes fragmentada y poca continuidad después de la atención. No se afirma una magnitud de estos problemas ni un incremento garantizado de ingresos.

La plataforma relaciona cada problema con una capacidad: atención contextual y seguimiento; agenda compartida con validación; pagos vinculados a reservas; recordatorios basados en estados reales; CRM con historial; poscita, campañas y beneficios con consentimiento y trazabilidad. El propietario podrá evaluar resultados observados y distinguirlos de atribuciones comerciales.

La actualización incorpora observaciones de operación real: existen negocios con reservas predominantemente telefónicas o presenciales y servicios cuyo precio se define después de una valoración en el local. Su prevalencia, preferencias de clientes y barreras de adopción deben validarse (OQ-PRO-05, OQ-EXP-04 y OQ-EXP-05); no se inventan proporciones de uso.

## 5. Mercado y segmento objetivo

El mercado inicial es Ecuador. Se priorizan centros de estética no médica, salones de belleza, centros de uñas y pestañas, peluquerías, barberías, spas y centros de bienestar no médico. El cliente inicial esperado tiene varios profesionales, actividad comercial suficiente y necesidad continua de coordinar citas y clientes. Esto es una hipótesis de perfil, sin umbrales inventados de ventas, empleados o reservas.

La plataforma debe servir a distintos tamaños sin convertirse en un ERP, un sistema clínico o una suite de recursos humanos. La operación con sucursales pertenece a V1; el detalle de titularidad entre negocios y sucursales requiere resolución en OQ-PRO-02.

El segmento incluye tanto negocios de precio fijo como negocios con valoración presencial. Las diferencias de operación y configuración entre ambos quedan para validación en OQ-PRO-04, sin excluir ninguno de V1.

## 6. Objetivos y resultados esperados

| Objetivo | Resultado verificable del producto | Evaluación de negocio |
| --- | --- | --- |
| Atender interesados y convertir conversaciones | Consulta y reserva conectadas, con origen registrado | MET-01 a MET-04; línea base y metas pendientes |
| Reducir trabajo repetitivo | Automatizaciones ejecutadas según eventos y reglas | MET-13; sin prometer ahorro cuantificado |
| Coordinar agenda, personal y recursos | Disponibilidad consistente y conflictos rechazados | MET-05 a MET-07 |
| Gestionar anticipos y reducir fricción | Pagos verificados y saldos trazables | MET-08; efecto sobre inasistencias por validar |
| Facilitar recurrencia y recuperación | Poscita, campañas y beneficios relacionados con el CRM | MET-09 a MET-12 |
| Dar control al establecimiento | Intervención humana, permisos y resultados consultables | Auditoría y MET-14 |
| Mantener hábitos de reserva y continuidad operativa | Reservas telefónicas y presenciales en agenda común, aun sin IA o WhatsApp | MET-15; preferencias y barreras por validar |
| Cotizar sin promesas de precio indebidas | Valoración, precio confirmado y pagos relacionados pero diferenciados | MET-16 y MET-17; sin equiparar estimación con ingreso |

No se fijan metas comerciales sin línea base. La aceptación funcional se comprueba por comportamientos; el impacto de negocio se evalúa después con definiciones y períodos acordados.

## 7. Alcance de la V1 comercial

Los doce módulos son compromisos de V1. El desarrollo podrá ser incremental, integrando primero configuraciones y datos autorizados, después reserva y pagos, y luego automatizaciones, campañas, fidelización y medición; este orden orientativo no sustituye una planificación posterior ni elimina módulos del lanzamiento.

La V1 incluye atención por WhatsApp y un panel para personal autorizado, configuración por establecimiento, múltiples profesionales, sucursales y recursos; reservas con y sin anticipo; CRM; operación humana; poscita; marketing; fidelización; analítica y administración SaaS. Incluye cobros del establecimiento a sus clientes y cobros del SaaS a los establecimientos como procesos diferenciados.

Incluye registro manual de reservas recibidas por teléfono o presencialmente, búsqueda de clientes y alta durante la reserva, canal de origen explícito y disponibilidad centralizada para todos los canales. No se requiere una conversación digital previa ni WhatsApp del cliente para reservar desde el panel. El CRM, pagos, beneficios y reportes funcionan para cualquier canal de origen; el envío de mensajes sí depende de canal disponible, preferencias y permisos aplicables. La independencia del panel respecto de IA/WhatsApp no implica operación sin conexión a la plataforma ni un modo sin internet.

Incluye las cuatro modalidades de precio de la sección 7.2, citas de valoración gratuitas o pagadas y registro de valoraciones realizadas directamente en el local. Se puede confirmar una reserva con precio del servicio todavía no definido cuando las reglas aplicables lo permiten; el importe de un anticipo solicitado debe estar determinado y autorizado aunque el precio total aún no lo esté.

Las variantes de pago, ventanas comerciales, vencimientos, frecuencia de comunicaciones, alcance de membresías y medidas de servicio quedan en OPEN_QUESTIONS. Las capacidades se mantienen en alcance; sus valores y modalidades requieren decisión. No se asume que todos los mensajes de WhatsApp sean gratuitos, que cualquier conversación habilite promociones ni que todos los proveedores permitan las mismas operaciones.

### 7.1 Convenciones funcionales propuestas para revisión

Un **tenant** es la frontera de aislamiento de un negocio; una sucursal es una ubicación dentro de esa frontera. La correspondencia comercial exacta se resolverá en OQ-PRO-02. Un cliente tiene identidad e historial dentro de cada tenant: no se propone un perfil compartido entre negocios.

Se propone distinguir estados de cita: solicitada, retenida temporalmente cuando corresponda, pendiente de pago, confirmada, completada, cancelada, inasistencia y expirada. El diseño definitivo de transiciones está pendiente en OQ-AGE-03. Una solicitud o un pago pendiente por sí solos no garantizan el horario: solo una retención válida o una confirmación comprometen capacidad. Cita, pago, conversación y suscripción tienen estados independientes relacionados.

Los permisos son capacidades funcionales a concretar posteriormente; no se define una matriz técnica de roles. No se presupone cobro automático de membresías de clientes por incluir beneficios recurrentes.

### 7.2 Modalidades de precio y valoración presencial

| Modalidad configurable por servicio | Información autorizada para comunicar | Límite de la promesa comercial |
| --- | --- | --- |
| Precio fijo | Importe exacto conocido antes de reservar | Las condiciones aceptadas se conservan; cambios requieren gestión explícita |
| Precio desde | Importe mínimo orientativo configurado | No se presenta como precio final; el valor definitivo puede cambiar |
| Rango de precios | Estimación entre mínimo y máximo configurados | No garantiza que el precio final permanezca en el rango salvo compromiso explícito del negocio |
| Precio sujeto a valoración | Necesidad de evaluación presencial para definir importe | No se inventa un precio definitivo ni se reemplaza lo desconocido por cero |

Una cita de valoración puede ser gratuita o pagada, con duración y profesional propios. El resultado comercial no clínico, la cotización posterior y su aceptación o rechazo se relacionan con cliente, valoración, reserva posterior y pagos. Una valoración sin reserva digital previa puede registrarse en el local; se mantiene la fecha real de atención y de registro sin inventar una reserva anterior.

Se distinguen **precio orientativo comunicado**, **precio confirmado por el establecimiento** e **importe efectivamente cobrado**. Confirmar el importe por personal autorizado no significa que el cliente lo haya aceptado ni que lo haya pagado. Las cotizaciones conservan versiones, estado de aceptación y modificaciones; una revisión no borra la propuesta anterior. Una estimación no es una cuenta por cobrar ni una base automática de porcentaje de anticipo.

Son configurables las reglas de anticipo, por ejemplo importe fijo para reservar valoración, anticipo del servicio después de confirmar su precio, o ausencia de anticipo. No existe porcentaje universal. Si no hay importe total confirmado, el saldo total del servicio se muestra pendiente de definición, conservando importes ya pagados o anticipos conocidos. Cobro de valoración, descuento posterior en el servicio, condiciones de aceptación antes de iniciar y facultades para modificar precios siguen pendientes (OQ-COM-04 a OQ-COM-08, OQ-PAY-04).

## 8. Actores y perfiles

| Actor | Responsabilidades y capacidades necesarias | Operaciones no permitidas sin autorización |
| --- | --- | --- |
| Cliente final | Consultar catálogo; solicitar reserva, cambio o cancelación; pagar; consultar sus beneficios; responder encuestas; gestionar preferencias y baja | Acceder a otros clientes, notas internas, agenda privada, datos del negocio o marcar su pago como verificado |
| Propietario o administrador | Configurar negocio, catálogo, políticas, personal, sucursales, campañas, beneficios; supervisar resultados y operaciones permitidas | Acceder a otro tenant; alterar un resultado de pasarela sin evidencia; borrar trazabilidad crítica |
| Recepcionista o administrativo | Atender conversaciones, gestionar citas y CRM, registrar operaciones y excepciones dentro de permisos | Cambiar suscripción, políticas, descuentos, devoluciones o permisos si no están autorizados |
| Profesional | Consultar citas autorizadas, información necesaria para prestar el servicio, disponibilidad y atención según permisos | Consultar indiscriminadamente CRM, conversaciones privadas o finanzas; modificar agendas ajenas o permisos |
| Administrador de plataforma | Gestionar tenants, suscripciones, incorporación, incidencias y soporte con acceso justificado y auditable | Examinar información privada de negocios de forma indiscriminada; usar acceso de soporte como acceso habitual |
| Agente de IA | Interpretar intención y contexto pertinente; consultar fuentes autorizadas; recomendar catálogo; proponer acciones; solicitar su ejecución con permisos controlados; derivar | Inventar precios, horarios, descuentos o pagos; cambiar políticas; confirmar operaciones sin validación; cruzar tenants; dar recomendaciones clínicas autónomas |
| Sistemas externos | Transportar mensajes y estados; procesar pagos y entregar evidencia verificable; comunicar fallos | Otorgar permisos internos por sí mismos; imponer cambios sin validación; convertir un evento repetido en otra operación |

La identidad del solicitante y su relación con la operación se verifican antes de mostrar o modificar información privada. Los mecanismos concretos se definirán después; conocer un número de cita no constituye por sí solo autorización.

El cliente puede solicitar reservas por WhatsApp, llamada o en el local. El recepcionista busca o registra clientes y documenta origen, condiciones y preferencias sin presumir consentimiento por recibir una llamada. El profesional puede realizar y registrar valoraciones no médicas; confirmar o modificar precios exige permiso específico por definir en OQ-COM-06. El cliente acepta o rechaza el importe ofrecido, sin que el registro interno de una cotización equivalga a su aceptación.

## 9. Descripción de los 12 módulos

| Módulo | Responsabilidad funcional y límites |
| --- | --- |
| MOD-01 — Recepcionista comercial con IA | Atención automática 24/7 por WhatsApp, contexto pertinente, intención, preguntas frecuentes, consulta de servicios, precios, duración y disponibilidad; venta consultiva, complementos, seguimiento y recuperación de interesados; derivación humana. La atención continua es capacidad objetivo, sujeta a disponibilidad de servicios y procedimientos de contingencia; no una garantía cuantificada. Propone acciones; el sistema ejecuta operaciones validadas. |
| MOD-02 — Agendamiento y reservaciones | Agenda central del establecimiento y por profesional; reservas por WhatsApp con IA y registro manual de llamadas y visitas; origen explícito, búsqueda y alta de cliente, valoraciones y reserva posterior. Confirmación, cambios, cancelaciones, bloqueos y estados; duraciones, preparación, recursos, sucursales, espera, ofrecimiento de vacantes, historial y políticas. Impide duplicados y sobreventa entre canales y funciona manualmente sin IA/WhatsApp. |
| MOD-03 — Profesionales, empleados y sucursales | Personal, roles operativos, especialidades, servicios habilitados, horarios, descansos, vacaciones, ausencias, asignaciones, ubicaciones y recursos compartidos. Configuración independiente por negocio; excluye nómina y recursos humanos avanzados. |
| MOD-04 — Catálogo de servicios | Categorías, descripciones, modalidad fijo, desde, rango o sujeto a valoración; duración, fotos, combinaciones, profesionales, disponibilidad, anticipos, promociones y condiciones comerciales. Valoraciones gratuitas o pagadas y propuestas versionadas con precio confirmado y aceptación diferenciados. Fuente autorizada de la IA; no es inventario físico. |
| MOD-05 — Pagos y anticipos | Anticipos opcionales u obligatorios por concepto y etapa, incluso con total del servicio aún no definido; cobro de valoración, pagos parciales y diferencias respecto del confirmado. Enlaces, verificación y estados, saldos y operaciones, retención si aplica, confirmación condicionada, fallos, duplicados, tardíos, cancelación, devoluciones y conciliación básica. Funciona para reservas de cualquier origen; proveedor pendiente. |
| MOD-06 — CRM de clientes | Perfil e historial comercial de cualquier canal, reservas, valoraciones, cotizaciones, aceptación y servicios; preferencias pertinentes, frecuencia, gasto, segmentos, profesional habitual, consentimiento, campañas, fidelización, paquetes, recompensas y observaciones internas permitidas. Vincula valoración, reserva posterior y pagos. Excluye historias clínicas y datos médicos especializados. |
| MOD-07 — Automatizaciones y poscita | Confirmaciones, recordatorios, asistencia, indicaciones, cambios controlados, cancelaciones y espera; agradecimiento, encuestas, reseñas y experiencias negativas; mantenimiento, nuevas citas, interesados e inactivos. Reglas temporales y condicionales basadas en hechos verificables de cualquier origen, con preferencias, consentimiento y canal disponible; separan valoración de servicio posterior y precio orientativo de confirmado. |
| MOD-08 — Marketing y campañas | Campañas de WhatsApp segmentadas, promociones, cupones, cumpleaños, recuperación, servicios previos y recurrencia; programación, historial y resultados; consentimiento, bajas y frecuencia. Sujetos a políticas vigentes del canal y normativa aplicable, cuya validación queda pendiente. |
| MOD-09 — Fidelización | Puntos, recompensas, recurrencia, cupones, paquetes prepagados y consumo de sesiones, membresías y beneficios recurrentes, referidos, vencimientos y redenciones auditables. Saldos consistentes, sin doble uso. |
| MOD-10 — Bandeja de atención humana | Conversaciones compartidas, responsables, estados, pendientes, alertas y notas internas; transferencia desde IA, pausa, respuesta manual y retorno controlado. |
| MOD-11 — Analítica y reportes | Actividad conversacional, conversión, agenda, ocupación, demanda, servicios, ingresos registrados, nuevos y recurrentes, frecuencia y reactivación; campañas, automatizaciones y resultados por establecimiento. Incluye todos los canales, valoraciones y reservas posteriores; separa orientativo, confirmado y cobrado, además de observación, atribución y estimación. |
| MOD-12 — Administración SaaS | Registro e incorporación de negocios con panel manual habilitable independientemente de WhatsApp e IA; usuarios y permisos, configuración y sucursales; planes, límites, suscripciones y cobros SaaS; panel interno, tenants, soporte, auditoría y aislamiento. Sin precios definitivos de planes. |

**Ampliación integrada de V1:** MOD-01 comunica modalidad e incertidumbre del precio; MOD-02 centraliza canales y agenda valoraciones sin depender del canal digital; MOD-04 configura las cuatro modalidades, valoración y cotizaciones; MOD-05 diferencia cobro de valoración, anticipos y saldo aún no definido; MOD-06 vincula valoraciones, versiones, aceptación, reservas y pagos; MOD-07 respeta preferencias y hechos comerciales de cualquier canal; MOD-09 aplica beneficios con las mismas reglas a reservas manuales; MOD-11 separa origen y etapas monetarias; MOD-12 permite habilitación independiente del panel. Los demás contenidos de los doce módulos se mantienen.

## 10. Requisitos funcionales identificados

Todos los requisitos de esta sección tienen **clasificación V1**. Las preguntas vinculadas afectan detalles pendientes, no la clasificación. Cada requisito contiene descripción, actor, precondiciones, resultado, aceptación y dependencias. Los criterios se aplican a entradas válidas y a los errores especificados; deben poder comprobarse con escenarios de prueba sin requerir una implementación determinada.

### 10.1 MOD-01 — Recepcionista comercial con IA

**FR-MOD01-001 — Atención y contexto.** Descripción: recibir y responder consultas de WhatsApp en cualquier horario, identificar intención y conservar contexto pertinente por cliente y negocio. Actor: cliente final mediante IA. Precondiciones: canal vinculado, negocio habilitado e identidad contextual disponible. Resultado: consulta respondida o derivación pendiente registrada. Aceptación: una consulta consecutiva conserva el servicio previamente mencionado; un mensaje ambiguo genera aclaración; no se recupera contexto de otro tenant; una indisponibilidad del canal queda registrada como incidencia sin declarar entrega. Dependencias: MOD-06, MOD-10, MOD-12.

**FR-MOD01-002 — Información autorizada.** Descripción: responder preguntas frecuentes y consultas de servicios, precios, duración, condiciones y disponibilidad real con fuentes aprobadas. Actor: IA. Precondiciones: catálogo y políticas publicados para el negocio. Resultado: respuesta consistente con información vigente. Aceptación: un servicio no publicado no se ofrece; un precio no definido no se inventa; antes de reservar se revalida disponibilidad; la falta de información genera aclaración o derivación. Dependencias: MOD-02, MOD-04, MOD-12.

**FR-MOD01-003 — Venta consultiva.** Descripción: recomendar servicios y complementos del catálogo según necesidades expresadas y condiciones habilitadas. Actor: IA. Precondiciones: catálogo consultable. Resultado: propuesta comercial identificable, sin compromiso de reserva o descuento todavía. Aceptación: cada recomendación corresponde a servicios habilitados; se informan precios y condiciones disponibles; el cliente puede rechazar complementos y continuar; una consulta clínica se deriva sin diagnóstico. Dependencias: MOD-04, MOD-10.

**FR-MOD01-004 — Seguimiento de oportunidades.** Descripción: registrar interés sin reserva y proponer seguimiento o recuperación según reglas autorizadas. Actor: administrador e IA. Precondiciones: oportunidad identificada y comunicación permitida. Resultado: seguimiento programado, ejecutado o suprimido con motivo. Aceptación: una reserva posterior detiene el seguimiento incompatible; una baja promocional excluye seguimientos promocionales; eventos repetidos no duplican el contacto; el resultado se vincula con la oportunidad. Dependencias: MOD-06, MOD-07, MOD-08; OQ-MKT-01, OQ-MKT-02.

**FR-MOD01-005 — Propuesta y ejecución controladas.** Descripción: separar interpretación conversacional de autorización y ejecución de reservas, pagos y beneficios; permitir transferencia humana. Actor: IA y sistema. Precondiciones: intención identificada, reglas y permisos disponibles. Resultado: operación validada con referencia verificable o rechazo explicado. Aceptación: la IA comunica confirmación solo tras éxito registrado; una petición de ignorar políticas no las cambia; un fallo no se presenta como éxito; ante toma humana se pausa la respuesta automática según MOD-10. Dependencias: MOD-02, MOD-05, MOD-09, MOD-10, MOD-12.

**FR-MOD01-006 — Comunicación de precios variables.** Descripción: comunicar la modalidad del precio y ofrecer valoración cuando corresponda, consultando cotización vigente autorizada si existe. Actor: IA. Precondiciones: servicio con modalidad publicada y acceso permitido al contexto comercial. Resultado: respuesta que distingue estimación, importe confirmado y cobro. Aceptación: un precio desde se expresa como mínimo orientativo, no total final; un rango se comunica como estimación sin prometer permanencia dentro de él salvo garantía configurada; sujeto a valoración no genera importe inventado; se distingue valoración gratuita de servicio gratuito; una cotización confirmada por el establecimiento no se declara aceptada o pagada sin evidencia; la IA no confirma ni modifica precios por iniciativa propia. Dependencias: MOD-04, MOD-05, MOD-06; OQ-COM-06, OQ-COM-07.

### 10.2 MOD-02 — Agendamiento y reservaciones

**FR-MOD02-001 — Disponibilidad compuesta.** Descripción: calcular agenda del establecimiento y por profesional considerando sucursal, servicio, duración, preparación, recursos y bloqueos. Actor: recepcionista, profesional autorizado o IA. Precondiciones: configuraciones operativas válidas. Resultado: horarios que pueden reservarse en la ubicación elegida. Aceptación: una ausencia excluye al profesional; un recurso ocupado excluye horarios incompatibles; la preparación consume capacidad definida; cambios en configuración invalidan ofertas desactualizadas antes de confirmar. Dependencias: MOD-03, MOD-04; OQ-AGE-01.

**FR-MOD02-002 — Crear y confirmar una reserva.** Descripción: reservar desde WhatsApp con IA o desde panel para solicitudes telefónicas, presenciales u otras manuales identificadas, aplicando las mismas validaciones, deduplicación y reglas de anticipo. Actor: cliente o recepcionista mediante sistema. Precondiciones: servicio activo, solicitante autorizado, capacidad válida y condiciones de reserva suficientes para su modalidad de precio. Resultado: solicitud, retención o cita confirmada según política. Aceptación: se registra cliente, servicio, profesional, sucursal, canal de origen y recursos necesarios; un reintento de la misma operación no crea otra cita; dos intentos concurrentes, incluso de distintos canales, no exceden capacidad; anticipo obligatorio pendiente no genera confirmación; un precio total aún no confirmado no bloquea una valoración o reserva permitida por política ni se sustituye por cero. Dependencias: MOD-05, MOD-06, MOD-12; OQ-PAY-01, OQ-PAY-04.

**FR-MOD02-003 — Cambios, cancelaciones y estados.** Descripción: confirmar, reagendar y cancelar aplicando políticas; registrar completada e inasistencia mediante actores autorizados. Actor: cliente o personal autorizado. Precondiciones: cita existente, identidad y transición válidas. Resultado: estado e historial coherentes, con implicaciones de pago notificadas. Aceptación: cada cambio conserva autor, momento y motivo; un cambio de horario solo sustituye la asignación anterior si el nuevo horario queda asegurado; una transición inválida se rechaza; cancelación libera capacidad y activa revisión de devolución si corresponde. Dependencias: MOD-05, MOD-07, MOD-12; OQ-AGE-03, OQ-COM-01.

**FR-MOD02-004 — Bloqueos y políticas de agenda.** Descripción: administrar bloqueos y reglas configurables de reserva y modificación. Actor: administrador o personal con permiso. Precondiciones: agenda y alcance autorizados. Resultado: restricciones aplicadas y conflictos visibles. Aceptación: un bloqueo impide nuevas reservas incompatibles; si afecta una cita existente, se muestra el conflicto sin cancelarla silenciosamente; las reglas definidas se aplican tanto a IA como al panel; no se acepta configuración temporal incoherente. Dependencias: MOD-03, MOD-12; OQ-AGE-01, OQ-AGE-02.

**FR-MOD02-005 — Lista de espera y vacantes.** Descripción: registrar preferencias de espera y ofrecer horarios liberados siguiendo reglas configurables. Actor: cliente y recepcionista o automatización. Precondiciones: solicitud vigente y contacto permitido. Resultado: ofrecimiento trazable y reserva validada si se acepta. Aceptación: la oferta respeta servicio, ubicación y profesional solicitados cuando sean restricciones; aceptar una oferta no evita revalidación; una vacante ocupada no se vuelve a confirmar; el cliente puede salir de la lista. Dependencias: MOD-03, MOD-07, MOD-08; OQ-AGE-02.

**FR-MOD02-006 — Registro manual multicanal sencillo.** Descripción: registrar reservas telefónicas y presenciales desde el panel, buscando cliente existente o creándolo durante la tarea. Actor: recepcionista o empleado autorizado. Precondiciones: sesión y configuración de agenda válidas; no se requiere conversación WhatsApp. Resultado: reserva en agenda central con origen y responsable diferenciados. Aceptación: se puede completar el recorrido buscar o crear cliente, elegir servicio, ubicación, profesional y horario, revisar condiciones y guardar sin transcribir una conversación digital; los resultados de búsqueda muestran datos suficientes para distinguir coincidencias autorizadas; no se exige dato ajeno a la finalidad o consentimiento promocional; errores identifican el campo y conservan información válida ingresada; el resumen distingue origen teléfono, presencial o WhatsApp del usuario que registró; se aplican las mismas reglas de capacidad, pago y beneficios en todos los canales. Dependencias: MOD-03, MOD-04, MOD-05, MOD-06, MOD-09, MOD-12; OQ-EXP-05 para evaluación con empleados de poca familiaridad tecnológica, sin inventar un tiempo objetivo.

**FR-MOD02-007 — Agenda independiente de IA y WhatsApp.** Descripción: mantener consultas, altas, cambios, cancelaciones y estados de agenda manual sin depender de IA o canal de mensajería. Actor: personal autorizado. Precondiciones: panel y servicio central de agenda disponibles, identidad y permisos válidos. Resultado: operación manual continua y disponibilidad compartida. Aceptación: sin WhatsApp configurado se registra una reserva telefónica; con IA o WhatsApp indisponibles se consulta y modifica agenda sin solicitar autorización de esos servicios; reservas manuales bloquean capacidad frente a intentos digitales presentes o posteriores; un aviso fallido no revierte la reserva válida; al recuperar canal no se duplican reservas ni se envían mensajes sin revalidar estado y permisos. Dependencias: MOD-03, MOD-06, MOD-07, MOD-12; OQ-ARC-02.

**FR-MOD02-008 — Agenda de valoraciones y reserva posterior.** Descripción: reservar valoraciones con duración, profesional y recursos necesarios, registrar una atención presencial sin reserva previa y vincular una reserva posterior del servicio. Actor: recepcionista, profesional autorizado o cliente mediante IA. Precondiciones: valoración configurada y autorización; disponibilidad para la cita futura o atención que se inicia en el local. Resultado: valoración y servicio posterior vinculados, sin confundir sus estados. Aceptación: se agenda valoración gratuita o pagada aplicando su propia política; para atención iniciada en el local se registra origen presencial y se valida capacidad necesaria; una valoración ya realizada se registra con fechas reales y cualquier conflicto queda visible, sin fabricar una confirmación retroactiva; convertir a servicio posterior crea cita relacionada tras aceptación aplicable y validación de capacidad, sin duplicar ni reemplazar la valoración; si el cliente no continúa se conserva el resultado sin crear reserva. Dependencias: MOD-03, MOD-04, MOD-05, MOD-06, MOD-12; OQ-COM-04, OQ-AGE-03.

### 10.3 MOD-03 — Profesionales, empleados y sucursales


**FR-MOD03-001 — Registro operativo del personal.** Descripción: registrar personal, estado, especialidades, roles operativos y servicios habilitados. Actor: administrador. Precondiciones: tenant activo y permisos de gestión. Resultado: personal utilizable en la operación autorizada. Aceptación: solo profesionales habilitados reciben un servicio; desactivar personal impide nuevas asignaciones y conserva historial; un rol operativo no concede permisos adicionales por inferencia. Dependencias: MOD-04, MOD-12.

**FR-MOD03-002 — Horarios y ausencias.** Descripción: configurar horarios individuales, descansos, vacaciones y ausencias por ubicación. Actor: administrador o profesional autorizado. Precondiciones: personal registrado. Resultado: disponibilidad actualizada y citas afectadas identificadas. Aceptación: ausencias excluyen nuevos horarios; una modificación muestra las citas afectadas; no se borran ni trasladan citas sin resolver el conflicto; un profesional no autorizado no modifica agendas ajenas. Dependencias: MOD-02, MOD-12; OQ-AGE-01.

**FR-MOD03-003 — Sucursales.** Descripción: administrar ubicaciones y asignar personal y servicios disponibles en cada una. Actor: administrador. Precondiciones: negocio configurado. Resultado: disponibilidad y citas asociadas a una ubicación identificable. Aceptación: una consulta por sucursal filtra sus servicios y profesionales; un empleado asignado a varias ubicaciones no puede tener citas incompatibles en ellas; desactivar una sucursal conserva registros y expone reservas pendientes. Dependencias: MOD-02, MOD-04, MOD-12; OQ-PRO-02, OQ-AGE-01.

**FR-MOD03-004 — Recursos compartidos.** Descripción: gestionar recursos necesarios para prestar servicios y su capacidad por ubicación. Actor: administrador. Precondiciones: sucursal y servicios existentes. Resultado: capacidad de recursos integrada en agenda. Aceptación: un servicio que requiere recurso no confirma sin capacidad; dos profesionales compiten por el mismo recurso según capacidad configurada; retirar un recurso muestra citas afectadas; una capacidad inválida se rechaza. Dependencias: MOD-02, MOD-04; OQ-AGE-01.

**FR-MOD03-005 — Asignaciones operativas.** Descripción: consultar y asignar citas a profesionales habilitados con el alcance permitido. Actor: recepcionista o profesional autorizado. Precondiciones: cita y personal disponibles. Resultado: asignación o reasignación registrada. Aceptación: se comprueban habilitación, ubicación y disponibilidad antes de reasignar; se preserva la asignación anterior si falla el cambio; el profesional ve solo citas e información autorizadas; el cambio genera avisos pertinentes. Dependencias: MOD-02, MOD-07, MOD-12.

### 10.4 MOD-04 — Catálogo de servicios

**FR-MOD04-001 — Fichas y categorías.** Descripción: administrar servicios, categorías, descripciones y fotografías con estado de publicación. Actor: administrador. Precondiciones: tenant configurado. Resultado: catálogo autorizado consultable. Aceptación: un borrador no aparece en recomendaciones; una ficha publicada expone información aprobada; desactivar un servicio conserva su historial; las fotos solo se publican con autorización del negocio. Dependencias: MOD-12.

**FR-MOD04-002 — Precio y duración.** Descripción: definir modalidad e información de precio, duración y preparación aplicables, incluidas variaciones comerciales autorizadas. Actor: administrador. Precondiciones: servicio existente. Resultado: información suficiente para comunicar la oferta y calcular agenda sin exigir siempre precio final. Aceptación: valores inválidos o rango con mínimo mayor que máximo no se publican; un servicio sujeto a valoración puede publicarse sin importe definitivo; información faltante distinta de la incertidumbre autorizada requiere aclaración y no una cotización inventada; la reserva conserva condiciones aceptadas, incluida modalidad orientativa cuando aplique; cambiar el catálogo no altera silenciosamente acuerdos anteriores. Dependencias: MOD-02, MOD-05; FR-MOD04-006; OQ-COM-02, OQ-COM-03.

**FR-MOD04-003 — Combinaciones y habilitación.** Descripción: crear servicios combinados y asignar profesionales, ubicaciones, recursos y disponibilidad. Actor: administrador. Precondiciones: componentes y personal definidos. Resultado: oferta combinada reservable con duración, modalidad de precio y condiciones suficientes, aunque el importe final dependa de valoración. Aceptación: se explicitan los componentes incluidos; se valida capacidad de todos los componentes necesarios; no se confirma una combinación con un componente inhabilitado; su precio no se infiere de una promoción inexistente; se indica qué importe o componente aún requiere valoración y no se suma como precio definitivo. Dependencias: MOD-02, MOD-03; OQ-AGE-01, OQ-COM-02.

**FR-MOD04-004 — Condiciones y anticipos del servicio.** Descripción: asociar requisitos de anticipo y condiciones de reserva autorizadas. Actor: administrador. Precondiciones: política del negocio definida. Resultado: condiciones visibles antes de comprometer la reserva. Aceptación: se distingue anticipo obligatorio de opcional; el cliente recibe monto o regla calculable y condiciones aplicables; una configuración incompleta bloquea confirmación dependiente y alerta al personal; IA y panel consultan las mismas condiciones. Dependencias: MOD-05, MOD-12; OQ-PAY-01.

**FR-MOD04-005 — Promociones del catálogo.** Descripción: configurar ofertas comerciales con elegibilidad, vigencia y compatibilidad con cupones y beneficios. Actor: administrador. Precondiciones: reglas comerciales y base de aplicación definidas. Resultado: promoción aplicada solo cuando corresponde sin convertir orientación en importe garantizado. Aceptación: una promoción vencida no se ofrece como vigente; se revalida elegibilidad antes de aplicar el beneficio; el importe resultante, su carácter orientativo o confirmado y condiciones quedan registrados; sin base autorizada suficiente no se inventa un importe final; una regla de acumulación no definida impide aplicar combinaciones ambiguas. Dependencias: MOD-08, MOD-09; OQ-COM-02, OQ-COM-08, OQ-LOY-01.

**FR-MOD04-006 — Modalidad configurable de precio.** Descripción: configurar por servicio precio fijo, desde, rango o sujeto a valoración y si un rango tiene garantía explícita. Actor: administrador autorizado. Precondiciones: servicio existente. Resultado: modalidad e información comercial autorizadas para panel e IA. Aceptación: fijo exige importe exacto; desde exige mínimo orientativo; rango exige mínimo y máximo coherentes y comunica si existe garantía; sujeto a valoración admite ausencia de precio definitivo; la ausencia de valor no se registra como cero; cambiar modalidad conserva condiciones ya comunicadas o aceptadas en las operaciones relacionadas. Dependencias: MOD-01, MOD-05; OQ-COM-02, OQ-COM-08.

**FR-MOD04-007 — Oferta de valoración presencial.** Descripción: configurar valoración gratuita o pagada con duración, profesional habilitado, condiciones y servicios que puede originar. Actor: administrador. Precondiciones: catálogo y profesionales registrados. Resultado: valoración ofrecible y reservable de forma independiente del precio futuro del servicio. Aceptación: gratuita se identifica expresamente sin implicar gratuidad del servicio posterior; pagada muestra importe autorizado conocido para ese concepto; duración y profesional participan en disponibilidad; obligatoriedad por servicio se aplica solo según configuración aprobada; el posible descuento de lo pagado por valorar no se presume. Dependencias: MOD-02, MOD-03, MOD-05; OQ-COM-04, OQ-COM-05.

**FR-MOD04-008 — Precio confirmado y aceptación de cotización.** Descripción: registrar resultado comercial no médico de valoración, emitir precio confirmado y conservar versiones, oferta al cliente, aceptación o rechazo. Actor: profesional o personal con permiso específico y cliente. Precondiciones: cliente identificado, valoración o fundamento comercial vinculado, facultad para confirmar o revisar precios definida. Resultado: propuesta de servicio y precio trazables, diferenciados de reserva y pago. Aceptación: una persona sin permiso no confirma ni modifica importe; la cotización se vincula con valoración, cliente y servicio; cambios previos a aceptación generan nueva versión con autor, motivo y momento; se registra qué versión e importe aceptó o rechazó el cliente y evidencia de esa decisión, incluido registro autorizado de aceptación presencial o telefónica; emitir no equivale a aceptar; modificar un importe ya aceptado exige nueva propuesta y aceptación para sustituir el acuerdo, sin sobrescribirlo; los requisitos para iniciar servicio y la vigencia de cotización dependen de política pendiente, no de una suposición. Dependencias: MOD-02, MOD-05, MOD-06, MOD-12; OQ-COM-06, OQ-COM-07, OQ-COM-08.

### 10.5 MOD-05 — Pagos y anticipos

**FR-MOD05-001 — Solicitud de pago y retención.** Descripción: generar enlaces de pago para anticipos o saldos y asociarlos a la operación; retener horario si la política lo exige. Actor: cliente o recepcionista mediante sistema. Precondiciones: importe autorizado, operación válida y medio habilitado. Resultado: solicitud identificable con estado y vencimiento cuando aplique. Aceptación: se informa monto, concepto y condiciones; anticipo opcional no se transforma en obligatorio; repetir solicitud no genera cobro adicional involuntario; se conoce si el horario está retenido o solo solicitado. Dependencias: MOD-02, MOD-04; OQ-PAY-01, OQ-INT-02.

**FR-MOD05-002 — Verificación y estados de pago.** Descripción: verificar fuente, importe, moneda, destinatario y relación con la operación antes de registrar un pago exitoso. Actor: sistema o personal autorizado según medio. Precondiciones: evidencia verificable y operación identificada. Resultado: pago pendiente, verificado, fallido o en revisión, separado del estado de cita. Aceptación: un mensaje o captura del cliente no confirma por sí solo; una notificación inválida no acredita saldo; evidencia repetida no duplica importe; datos discordantes quedan para revisión sin confirmar reserva. Dependencias: MOD-02, MOD-12; OQ-PAY-02, OQ-INT-02.

**FR-MOD05-003 — Saldos y registro de operaciones.** Descripción: registrar anticipos, pagos parciales y finales, cobros de valoración, otros cobros permitidos y saldos por cita o compra de beneficios de cualquier canal. Actor: recepcionista autorizada o sistema. Precondiciones: concepto, importe de cada movimiento y forma de verificación definidos. Resultado: importes pagados y saldo explicables sin equiparar estimación, cotización y cobro. Aceptación: un anticipo verificado se aplica una sola vez al concepto correspondiente; un pago fallido no reduce saldo; con precio total sin confirmar se muestra saldo total pendiente de definición, sin usar cero ni el mínimo orientativo; con total confirmado se muestran pagos aplicados, diferencia pendiente o excedente para revisión; una corrección conserva movimiento original y motivo; cobros de clientes se distinguen de suscripciones SaaS. Dependencias: MOD-04, MOD-06, MOD-09, MOD-11; OQ-PAY-02, OQ-PAY-04, OQ-COM-03, OQ-COM-05.

**FR-MOD05-004 — Excepciones de pago.** Descripción: gestionar pagos fallidos, duplicados y tardíos, incluida expiración de retenciones. Actor: sistema y recepcionista. Precondiciones: solicitud existente y estado actual comprobable. Resultado: resolución o incidencia pendiente sin sobreventa ni cobro repetido. Aceptación: al expirar se libera retención según política; un pago tardío no recupera automáticamente un horario ocupado; se ofrece resolución autorizada de nueva reserva o devolución cuando corresponda; duplicidad real de cobro se distingue de duplicidad de notificación. Dependencias: MOD-02, MOD-10; OQ-PAY-01, OQ-PAY-03.

**FR-MOD05-005 — Devoluciones y conciliación básica.** Descripción: aplicar políticas de cancelación y devolución, y contrastar registros con evidencia del medio de pago. Actor: administrador o personal autorizado. Precondiciones: pago verificable y política aplicable. Resultado: devolución solicitada, pendiente, confirmada o rechazada con diferencias conciliatorias visibles. Aceptación: solicitar devolución no equivale a completarla; un reintento no duplica devolución; diferencias de importe o estado se identifican para revisión; ingresos y saldo reflejan devoluciones verificadas con trazabilidad. Dependencias: MOD-11, MOD-12; OQ-PAY-03, OQ-INT-02.

**FR-MOD05-006 — Cobros con precio total no confirmado.** Descripción: cobrar valoración o anticipos de importe conocido, aplicar pagos parciales y resolver diferencias respecto del precio confirmado sin exigir un precio total prematuro. Actor: personal autorizado y sistema. Precondiciones: concepto e importe a cobrar autorizados y política aplicable; no necesariamente precio total del servicio confirmado. Resultado: movimiento verificable vinculado con valoración, reserva, cliente y cotización cuando exista. Aceptación: se puede cobrar importe fijo de valoración sin precio final del servicio; no se calcula porcentaje sobre un importe desconocido ni se impone porcentaje universal; si se requiere anticipo sobre precio confirmado se espera esa confirmación; cada pago parcial se aplica una vez al concepto correspondiente; descuento posterior del cobro de valoración solo ocurre si política lo permite y no registra otro ingreso; un cambio de precio antes de aceptación deja versión y revisión del anticipo sin recobro automático; cancelación y cobro superior o inferior al confirmado se muestran para resolución autorizada, no se igualan alterando datos históricos. Dependencias: MOD-02, MOD-04, MOD-06, MOD-11; OQ-COM-05, OQ-COM-08, OQ-PAY-03, OQ-PAY-04.

### 10.6 MOD-06 — CRM de clientes

**FR-MOD06-001 — Perfil e identidad comercial.** Descripción: mantener perfil del cliente e interacciones de cualquier canal dentro del negocio, evitando duplicación indebida. Actor: recepcionista o sistema. Precondiciones: identidad y autorización suficientes para la acción. Resultado: cliente relacionado con múltiples citas, valoraciones e interacciones, con o sin conversación digital. Aceptación: el personal busca por nombre o dato de contacto disponible y autorizado; puede seleccionar coincidencia o registrar cliente nuevo durante la reserva; otra cita o canal no crea necesariamente otro cliente; no se exige cuenta WhatsApp ni consentimiento promocional para alta manual; posibles duplicados se presentan para resolución autorizada; no se fusionan clientes de otros tenants; corregir o unir identidades conserva referencias e historial de la operación. Dependencias: MOD-12; OQ-PRO-03, OQ-SEC-01, OQ-EXP-04.

**FR-MOD06-002 — Historial y relaciones.** Descripción: consultar reservas, servicios recibidos, interacciones, pagos, campañas y beneficios del cliente. Actor: personal autorizado. Precondiciones: cliente identificado y permiso de consulta. Resultado: recorrido comercial trazable. Aceptación: una cita cancelada no figura como servicio completado; una campaña puede vincularse al contacto y resultado observado; paquetes y recompensas muestran estado vigente; un profesional no accede a datos fuera de su permiso. Dependencias: MOD-02, MOD-05, MOD-08, MOD-09, MOD-12.

**FR-MOD06-003 — Preferencias y observaciones.** Descripción: registrar preferencias pertinentes, profesional habitual y observaciones internas permitidas. Actor: personal autorizado. Precondiciones: finalidad comercial u operativa definida. Resultado: información útil y limitada para atención no médica. Aceptación: las notas internas no se envían al cliente como respuesta pública; se distingue preferencia de asignación garantizada; el formulario indica la exclusión de datos clínicos y especializados; se puede corregir información según permiso y trazabilidad. Dependencias: MOD-03, MOD-10; OQ-SEC-01, OQ-SEC-02.

**FR-MOD06-004 — Segmentación comercial.** Descripción: calcular frecuencia, gasto registrado, recurrencia y segmentos mediante reglas explícitas. Actor: administrador. Precondiciones: historial y definiciones de indicadores disponibles. Resultado: segmentos reproducibles y explicables. Aceptación: cada segmento muestra su criterio y período; pagos fallidos no cuentan como gasto pagado; el cliente sin historial no se clasifica como recurrente sin evidencia; cambios en criterio recalculan elegibilidad sin alterar hechos históricos. Dependencias: MOD-05, MOD-11; OQ-PRO-03, OQ-MKT-03.

**FR-MOD06-005 — Consentimiento y preferencias de contacto.** Descripción: registrar origen, momento, alcance y cambios del consentimiento promocional, así como bajas. Actor: cliente y personal autorizado. Precondiciones: identidad y canal de solicitud identificados. Resultado: preferencia aplicable a los envíos del tenant. Aceptación: ausencia de consentimiento no se interpreta como autorización; la baja afecta campañas programadas; un nuevo consentimiento conserva el historial y exige evidencia; mensajes operativos se evalúan por su finalidad y reglas aplicables, no se usan para ocultar promociones. Dependencias: MOD-07, MOD-08; OQ-MKT-01, OQ-SEC-01.

**FR-MOD06-006 — Historial comercial multicanal y de valoraciones.** Descripción: relacionar origen de reserva, interacciones manuales, preferencias, resultado no médico de valoración, versiones de precio, aceptación, citas y pagos. Actor: personal autorizado. Precondiciones: cliente y alcance de acceso identificados. Resultado: recorrido único dentro del tenant, independiente de conversación digital. Aceptación: un cliente telefónico o presencial consulta y usa pagos, paquetes y recompensas mediante personal con las mismas reglas de elegibilidad; no se exige WhatsApp para tener historial; valoración y cita posterior se distinguen y vinculan; se muestran por separado importe orientativo comunicado, confirmado y cobrado, con sus fechas; el resultado no admite convertir el CRM en historia clínica; preferencias de comunicación no se infieren del canal de reserva. Dependencias: MOD-02, MOD-04, MOD-05, MOD-09, MOD-12; OQ-PRO-03, OQ-SEC-01.

### 10.7 MOD-07 — Automatizaciones y poscita

**FR-MOD07-001 — Reglas y ejecución.** Descripción: configurar disparadores, tiempos, condiciones, exclusiones y pausa para automatizaciones. Actor: administrador. Precondiciones: evento verificable y regla habilitada. Resultado: ejecución, supresión o fallo trazable. Aceptación: el estado se revalida antes de ejecutar; reintentar un evento no repite efectos; puede pausarse una regla; se registra qué condición permitió o impidió su ejecución. Dependencias: MOD-12; OQ-COM-01, OQ-MKT-02.

**FR-MOD07-002 — Comunicaciones de cita.** Descripción: enviar confirmaciones, recordatorios, solicitudes de asistencia, indicaciones previas y avisos de cancelación según estado para citas de cualquier origen. Actor: sistema. Precondiciones: cita vigente, medio de contacto disponible y comunicación permitida por finalidad y preferencias. Resultado: comunicación entregada cuando hay evidencia, o pendiente, fallida o suprimida con motivo. Aceptación: una cancelación suprime recordatorios incompatibles; un cambio usa fecha y ubicación nuevas; confirmar asistencia no equivale a confirmar un pago; no disponer de WhatsApp o no autorizar mensajes no cancela la reserva manual; la falta de contacto o permiso suprime envío sin inventar entrega; un fallo aparece para seguimiento autorizado. Dependencias: MOD-02, MOD-06, MOD-10; OQ-MKT-01, OQ-INT-01, OQ-EXP-04.

**FR-MOD07-003 — Reagendamiento controlado y espera.** Descripción: automatizar propuestas de cambio y ofrecimiento de vacantes con validación de capacidad y aceptación requerida. Actor: sistema y cliente. Precondiciones: cita o espera vigente y regla aprobada. Resultado: propuesta o cambio autorizado registrado. Aceptación: proponer no modifica una cita; la aceptación revalida disponibilidad; un conflicto exige alternativa o atención humana; no se desplaza una cita existente sin autorización del cliente o política explícita aprobada. Dependencias: MOD-02, MOD-03, MOD-10; OQ-AGE-02, OQ-COM-01.

**FR-MOD07-004 — Poscita y satisfacción.** Descripción: enviar agradecimientos, encuesta y solicitud de reseña; escalar experiencias negativas. Actor: sistema y recepcionista. Precondiciones: servicio marcado completado y reglas de contacto válidas. Resultado: seguimiento y respuesta asociados a la cita. Aceptación: una inasistencia no activa agradecimiento por servicio recibido; una encuesta respondida no se procesa dos veces; una experiencia negativa genera pendiente humano según criterio configurado; la solicitud de reseña respeta reglas acordadas y no inventa valoraciones. Dependencias: MOD-02, MOD-06, MOD-10; OQ-EXP-02.

**FR-MOD07-005 — Continuidad y recuperación.** Descripción: programar mantenimiento no clínico, sugerencias de próxima visita, seguimientos a interesados y recuperación de inactivos. Actor: administrador y sistema. Precondiciones: criterio temporal definido, historial suficiente y contacto permitido. Resultado: mensaje pertinente o supresión justificada. Aceptación: una nueva reserva inhibe propuestas incompatibles; se comprueba consentimiento cuando la finalidad es promocional; se coordinan campañas y seguimientos para cumplir frecuencia; se conserva el vínculo con la regla y el resultado observado. Dependencias: MOD-01, MOD-06, MOD-08, MOD-11; OQ-MKT-02, OQ-MKT-03.

**FR-MOD07-006 — Automatización multicanal y de valoración.** Descripción: activar reglas desde reservas de cualquier origen y desde valoraciones o cotizaciones, atendiendo a estado real, preferencias, consentimiento aplicable y canal disponible. Actor: administrador y sistema. Precondiciones: regla aprobada, evento registrado y elegibilidad comprobable. Resultado: acción pertinente, pendiente o supresión con causa, sin bloquear operación manual. Aceptación: una cita telefónica puede activar recordatorio por WhatsApp si el cliente lo permite y el canal está habilitado; sin medio o permiso no se fuerza mensajería ni se cancela cita; una valoración completada no se interpreta como servicio posterior completado; cotización rechazada o revisada suprime avisos incompatibles; una nueva reserva detiene seguimiento de valoración sin conversión cuando dejó de corresponder; mensajes no presentan precio orientativo como definitivo. Dependencias: MOD-02, MOD-04, MOD-06, MOD-08; OQ-MKT-01, OQ-EXP-04.

### 10.8 MOD-08 — Marketing y campañas

**FR-MOD08-001 — Audiencias y tipos de campaña.** Descripción: crear campañas segmentadas por inactividad, servicios anteriores, cumpleaños y recurrencia, u otros criterios autorizados del CRM. Actor: administrador. Precondiciones: criterio definido y datos pertinentes disponibles. Resultado: audiencia explicable y elegible. Aceptación: cumpleaños no presupone que se deba recoger fecha completa de nacimiento; registros sin dato requerido se excluyen con motivo; la audiencia solo contiene clientes del tenant; no se envía por pertenecer al segmento si falta permiso de contacto. Dependencias: MOD-06; OQ-MKT-01, OQ-MKT-03, OQ-SEC-01.

**FR-MOD08-002 — Promociones y cupones.** Descripción: vincular campañas con ofertas y cupones definidos por vigencia, elegibilidad y usos permitidos. Actor: administrador. Precondiciones: reglas comerciales configuradas. Resultado: oferta comunicada y redención validable. Aceptación: un cupón vencido o no elegible se rechaza; el sistema aplica descuentos sobre una base autorizada y conserva la modalidad orientativa o confirmada del precio; no convierte una estimación en precio final; no se duplica una redención por reintento; se conserva el origen de campaña sin asumir causalidad de ingresos. Dependencias: MOD-04, MOD-09, MOD-11; OQ-LOY-01, OQ-COM-08.

**FR-MOD08-003 — Programación y envío permitido.** Descripción: preparar y programar envíos de WhatsApp con controles de políticas del canal, elegibilidad, frecuencia y costos variables. Actor: administrador y sistema. Precondiciones: canal habilitado, contenido apto y reglas vigentes verificadas. Resultado: envío autorizado o bloqueo con motivo. Aceptación: se revalida consentimiento y baja al enviar; el contenido no apto para el canal no se despacha; se coordina frecuencia entre campañas y automatizaciones; se muestran condiciones conocidas de consumo sin asumir gratuidad ni inventar costos desconocidos. Dependencias: MOD-07, MOD-12; OQ-MKT-01, OQ-MKT-02, OQ-INT-01.

**FR-MOD08-004 — Baja y control de contacto.** Descripción: tramitar solicitudes de no recibir promociones desde conversación o gestión autorizada. Actor: cliente o recepcionista. Precondiciones: destinatario identificado. Resultado: exclusión promocional con historial. Aceptación: una baja inequívoca se registra sin exigir una campaña nueva; envíos pendientes se excluyen antes del despacho; un envío ya despachado se distingue de otro aún suprimible; un mensaje ambiguo se aclara o deriva sin continuar promociones mientras se resuelve. Dependencias: MOD-01, MOD-06, MOD-10; OQ-MKT-01.

**FR-MOD08-005 — Historial y resultados.** Descripción: consultar campañas, destinatarios, mensajes, respuestas, bajas y reservas vinculadas. Actor: administrador. Precondiciones: campaña registrada y permisos de consulta. Resultado: reporte con cobertura y limitaciones explícitas. Aceptación: se distingue programado, enviado, entregado y fallido cuando el canal lo informa; la ausencia de confirmación no se presenta como lectura; reservas atribuidas muestran regla y período; el historial registra cancelaciones o suspensión de envíos. Dependencias: MOD-11; OQ-MKT-03.

### 10.9 MOD-09 — Fidelización

**FR-MOD09-001 — Puntos y recurrencia.** Descripción: configurar programas de puntos, recompensas y beneficios por recurrencia a partir de hechos válidos. Actor: administrador y sistema. Precondiciones: reglas de acumulación y elegibilidad definidas. Resultado: movimientos y saldo consultables. Aceptación: cada acreditación tiene origen verificable; eventos repetidos no acreditan dos veces; se informa criterio de beneficio; una reversión conserva movimiento y motivo según política. Dependencias: MOD-02, MOD-05, MOD-06; OQ-LOY-01.

**FR-MOD09-002 — Redención y vencimiento.** Descripción: redimir recompensas y cupones, controlar vencimiento, restricciones y concurrencia. Actor: cliente mediante personal o sistema. Precondiciones: beneficio vigente y saldo suficiente. Resultado: consumo auditable o rechazo con causa. Aceptación: dos intentos simultáneos no consumen más saldo disponible; vencidos no se redimen; reintentar no duplica uso; correcciones o restituciones requieren permiso y conservan historial. Dependencias: MOD-04, MOD-08, MOD-12; OQ-LOY-01.

**FR-MOD09-003 — Paquetes prepagados.** Descripción: vender paquetes de sesiones, registrar pago, vigencia, saldo y uso por cita elegible. Actor: recepcionista y cliente. Precondiciones: paquete configurado y pago verificado para activación. Resultado: sesiones disponibles y consumidas coherentes. Aceptación: un pago pendiente no activa un paquete pagado; cada consumo referencia la cita; se aplica la política definida sobre reserva, cancelación, inasistencia y finalización; eventos duplicados o simultáneos no dejan saldo negativo ni doble consumo. Dependencias: MOD-02, MOD-05, MOD-06; OQ-LOY-02.

**FR-MOD09-004 — Membresías y beneficios recurrentes.** Descripción: gestionar vigencia y renovación de membresías y disponibilidad de beneficios por período. Actor: administrador, cliente y sistema. Precondiciones: reglas de período, pago y elegibilidad definidas. Resultado: membresía y beneficios con estado explicable. Aceptación: una membresía vencida no concede beneficios vigentes; renovar no acredita dos veces el mismo período; se distinguen renovación manual y cobro recurrente si este se autoriza; cancelar aplica las condiciones aprobadas. Dependencias: MOD-05, MOD-06; OQ-LOY-03, OQ-INT-02.

**FR-MOD09-005 — Referidos e historial.** Descripción: registrar referidos, evaluar condiciones de recompensa y consultar movimientos de fidelización. Actor: cliente, recepcionista o administrador. Precondiciones: programa definido e identidad suficiente. Resultado: relación de referido y recompensa justificadas. Aceptación: la recompensa requiere el evento elegible configurado; una referencia repetida no duplica beneficio; se aplica política contra autorreferidos y abusos aprobada; el historial permite reconstruir saldo inicial, movimientos y saldo final. Dependencias: MOD-06, MOD-11, MOD-12; OQ-LOY-01.

### 10.10 MOD-10 — Bandeja de atención humana

**FR-MOD10-001 — Bandeja compartida.** Descripción: listar conversaciones del tenant con responsable, estado de atención y pendientes. Actor: recepcionista o administrador. Precondiciones: usuario autorizado y canal conectado. Resultado: trabajo visible y asignable. Aceptación: se filtra por responsable o estado; una conversación sin respuesta pendiente es identificable; no se muestran conversaciones de otro negocio; un error del canal no se oculta como conversación resuelta. Dependencias: MOD-01, MOD-12.

**FR-MOD10-002 — Asignación y alertas.** Descripción: asignar, reasignar y escalar conversaciones, incluidas incidencias de pago o satisfacción. Actor: personal autorizado. Precondiciones: conversación existente. Resultado: responsable y motivo de atención registrados. Aceptación: reasignar conserva historial; un responsable no disponible deja un pendiente visible; alertas se relacionan con la incidencia; no se expone información a usuarios sin permiso. Dependencias: MOD-05, MOD-07, MOD-12; OQ-EXP-01.

**FR-MOD10-003 — Toma de control y pausa.** Descripción: transferir desde IA a humano y suspender respuestas conversacionales automáticas en esa conversación. Actor: cliente, IA o personal autorizado. Precondiciones: conversación activa. Resultado: control humano explícito. Aceptación: pedir asistencia humana genera pendiente; tomar control impide que una respuesta de IA aún no despachada compita con la manual; mensajes nuevos permanecen visibles; se distingue pausa conversacional de comunicaciones operativas independientes. Dependencias: MOD-01, MOD-07; OQ-EXP-01.

**FR-MOD10-004 — Respuesta y notas internas.** Descripción: responder manualmente y añadir notas internas con contexto de citas y cliente autorizado. Actor: recepcionista. Precondiciones: permiso, control y reglas del canal válidas. Resultado: respuesta o nota registrada según su destinatario. Aceptación: una nota interna no se envía por WhatsApp; el estado de entrega manual refleja evidencia real; una respuesta que implique reservar usa validaciones de agenda; las notas no incorporan historiales clínicos como función del producto. Dependencias: MOD-02, MOD-06, MOD-12; OQ-SEC-02.

**FR-MOD10-005 — Retorno controlado a IA.** Descripción: cerrar atención humana o devolverla explícitamente a IA según política. Actor: personal autorizado. Precondiciones: conversación en control humano y asunto atendido o transferible. Resultado: control actualizado con contexto pertinente. Aceptación: se registra quién devolvió el control; una incidencia sin resolver permanece visible; la IA no retoma únicamente por recibir otro mensaje mientras sigue pausada; se aplican las preferencias de contacto vigentes. Dependencias: MOD-01, MOD-06, MOD-12; OQ-EXP-01.

### 10.11 MOD-11 — Analítica y reportes

**FR-MOD11-001 — Embudo y conversaciones.** Descripción: medir conversaciones recibidas, interesados, conversión a reservas y reservas gestionadas por IA. Actor: administrador. Precondiciones: eventos y definiciones disponibles. Resultado: embudo por período y alcance autorizado. Aceptación: numerador y denominador son visibles; reintentos no cuentan como nuevas conversiones; se distingue intervención de IA de reserva creada por IA; el dato sin origen no se atribuye automáticamente. Dependencias: MOD-01, MOD-02, MOD-06; OQ-PRO-03, OQ-MKT-03.

**FR-MOD11-002 — Operación de agenda.** Descripción: reportar confirmadas, completadas, cancelaciones, inasistencias, ocupación, demanda horaria y servicios populares. Actor: administrador o personal autorizado. Precondiciones: agenda y disponibilidad registradas. Resultado: indicadores con estado, período y base de cálculo. Aceptación: canceladas no cuentan como completadas; ocupación considera capacidad habilitada y bloqueos según definición visible; demanda incluye solicitudes sin reserva si están registradas y se identifica su cobertura; filtros por sucursal y profesional respetan permisos. Dependencias: MOD-02, MOD-03; OQ-PRO-03.

**FR-MOD11-003 — Ingresos registrados.** Descripción: consultar precios orientativos, importes confirmados, cobrados, pendientes y devueltos en series diferenciadas, con asociación a servicios, valoraciones, canal y campañas. Actor: administrador autorizado. Precondiciones: registros comerciales y evidencia de pago disponibles para cada serie. Resultado: reporte comercial que no se presenta como contabilidad completa. Aceptación: anticipos y saldo final no duplican el total cobrado; una estimación no se suma como ingreso ni cuenta por cobrar; total no confirmado se identifica como pendiente de definición; cobro de valoración descontado del servicio no se vuelve a contar como nuevo dinero; devoluciones muestran su estado; diferencias entre precio confirmado y cobrado se explicitan; origen telefónico o presencial no se atribuye automáticamente a IA. Dependencias: MOD-04, MOD-05, MOD-06, MOD-09; OQ-COM-03, OQ-COM-05, OQ-COM-08, OQ-MKT-03.

**FR-MOD11-004 — Clientes y retención.** Descripción: medir nuevos, recurrentes, frecuencia de visitas y reactivaciones con reglas explícitas. Actor: administrador. Precondiciones: historial suficiente y criterios definidos. Resultado: indicadores reproducibles por cliente y período. Aceptación: nueva conversación no equivale automáticamente a nuevo cliente atendido; se define qué evento cuenta como visita; reactivación referencia el criterio de inactividad; historial insuficiente se señala y no se rellena con estimaciones ocultas. Dependencias: MOD-06, MOD-09; OQ-PRO-03, OQ-MKT-03.

**FR-MOD11-005 — Campañas y automatizaciones.** Descripción: consultar uso, entregas, fallos, respuestas, reservas asociadas y resultados generales por establecimiento. Actor: administrador. Precondiciones: campañas y ejecuciones registradas. Resultado: reporte que separa hechos, atribuciones y estimaciones. Aceptación: cada atribución informa ventana y criterio; una estimación muestra método y limitaciones; sin datos de entrega no se afirma entrega; se pueden contrastar agregados con eventos permitidos sin cruzar tenants. Dependencias: MOD-07, MOD-08, MOD-12; OQ-MKT-03, OQ-ARC-03.

**FR-MOD11-006 — Reportes multicanal y de valoración.** Descripción: analizar origen de reservas, valoraciones, propuestas, aceptación y conversión a servicios posteriores, separando sus importes. Actor: administrador autorizado. Precondiciones: origen y vínculos comerciales registrados; criterios de conteo visibles. Resultado: totales generales y desgloses comparables, sin limitar reportes a WhatsApp. Aceptación: una reserva telefónica o presencial figura en agenda, clientes, pagos y fidelización sin atribuirse a IA; origen de reserva se conserva separado de mensajes posteriores y campaña asociada; una valoración completada no cuenta automáticamente como tratamiento realizado; importes orientativos, confirmados y cobrados están en series separadas; una valoración que origina reserva posterior se cuenta según vínculo verificable y no por inferencia; origen desconocido se identifica y no se reasigna a WhatsApp. Dependencias: MOD-02, MOD-04, MOD-05, MOD-06, MOD-09; OQ-PRO-04, OQ-PRO-05, OQ-COM-08, OQ-MKT-03.

### 10.12 MOD-12 — Administración SaaS

**FR-MOD12-001 — Registro e incorporación.** Descripción: registrar tenants y guiar configuración de negocio, sucursales, catálogo, políticas y capacidades digitales habilitables por separado. Actor: propietario y administrador de plataforma según alcance. Precondiciones: identidad del negocio y permisos de incorporación. Resultado: panel operativo para reservas manuales cuando sus configuraciones están completas, con estado independiente de WhatsApp e IA. Aceptación: se identifican configuraciones faltantes por capacidad; no vincular WhatsApp no bloquea agenda, CRM ni registros manuales autorizados; una conexión inválida bloquea solo las acciones que la necesitan, sin desactivar capacidades independientes; cada configuración pertenece al tenant correcto; el estado del canal es visible. Dependencias: MOD-03, MOD-04; OQ-PRO-02, OQ-INT-01.

**FR-MOD12-002 — Usuarios y permisos.** Descripción: administrar acceso y capacidades por negocio, sucursal y función cuando corresponda. Actor: administrador autorizado. Precondiciones: identidad verificada y alcance concedido. Resultado: operaciones limitadas a permisos vigentes. Aceptación: revocar permiso impide nuevas operaciones restringidas; cambiar de tenant no conserva autorización anterior; un empleado no eleva su propio acceso; permisos se comprueban también en acciones solicitadas por IA. Dependencias: OQ-SEC-03; definición técnica de roles posterior.

**FR-MOD12-003 — Planes, límites y suscripciones.** Descripción: configurar oferta SaaS, límites de uso, suscripciones y cobros a negocios con estados verificables. Actor: propietario y administrador de plataforma. Precondiciones: modelo comercial y políticas definidos. Resultado: negocio conoce plan, uso, cobros y restricciones aplicables. Aceptación: no se fijan precios por defecto desde hipótesis; cobro repetido notificado no duplica período; alcanzar un límite genera comportamiento informado según política; suspensión, cambio o reactivación preservan registros y obligaciones pendientes según reglas aprobadas. Dependencias: OQ-BIZ-01, OQ-BIZ-02, OQ-BIZ-03, OQ-INT-02.

**FR-MOD12-004 — Aislamiento y auditoría.** Descripción: aislar información y operaciones de tenants y registrar acciones críticas con autor, momento, objeto, resultado y motivo cuando corresponda. Actor: sistema y administrador autorizado. Precondiciones: contexto de tenant e identidad de operación establecidos. Resultado: acceso restringido y trazabilidad consultable. Aceptación: intentar consultar o modificar un objeto ajeno se rechaza; reportes, contexto de IA y mensajes respetan el mismo aislamiento; reserva, pago, beneficio y cambio de permiso dejan evidencia; reintentos no borran la secuencia histórica. Dependencias: todos los módulos; OQ-SEC-02, OQ-ARC-01.

**FR-MOD12-005 — Panel interno y soporte administrativo.** Descripción: gestionar tenants, incidencias, conexiones y suscripciones con acceso de soporte limitado. Actor: administrador de plataforma. Precondiciones: motivo de soporte y autorización apropiada. Resultado: intervención acotada y auditable. Aceptación: el panel no otorga acceso indiscriminado a conversaciones; acceso excepcional registra alcance, motivo y operador; puede revocarse; no permite presentar pagos no verificados como exitosos ni eliminar auditoría. Dependencias: MOD-10; OQ-SEC-03, OQ-BIZ-03.

### 10.13 Tabla de trazabilidad de requisitos

Los intervalos incluyen ambos extremos; existen 71 requisitos en total. Se conservan los sesenta identificadores iniciales y se incorporan once requisitos de esta revisión. Los flujos son recorridos representativos: la aceptación de V1 también debe comprobar los requisitos que no aparecen en un flujo específico.

| Módulo | Requisitos | Flujos relacionados |
| --- | --- | --- |
| MOD-01 | FR-MOD01-001 a FR-MOD01-006 | FL-01, FL-02, FL-03, FL-04, FL-11, FL-14, FL-18; FL-16 y FL-17 solo si luego interviene IA |
| MOD-02 | FR-MOD02-001 a FR-MOD02-008 | FL-01 a FL-05, FL-09, FL-10, FL-12, FL-13, FL-16 a FL-19 |
| MOD-03 | FR-MOD03-001 a FR-MOD03-005 | FL-02, FL-03, FL-10, FL-13, FL-16 a FL-19 |
| MOD-04 | FR-MOD04-001 a FR-MOD04-008 | FL-01, FL-02, FL-03, FL-07, FL-09, FL-16 a FL-19 |
| MOD-05 | FR-MOD05-001 a FR-MOD05-006 | FL-02, FL-04, FL-05, FL-09, FL-12, FL-15, FL-18; FL-03, FL-13 y FL-16 a FL-19 según cobro o retención |
| MOD-06 | FR-MOD06-001 a FR-MOD06-006 | FL-01 a FL-09, FL-14 a FL-19 |
| MOD-07 | FR-MOD07-001 a FR-MOD07-006 | FL-01 a FL-08, FL-10, FL-14, FL-16 a FL-19 según reglas y permiso de contacto |
| MOD-08 | FR-MOD08-001 a FR-MOD08-005 | FL-01, FL-06, FL-07, FL-08, FL-14, FL-15 |
| MOD-09 | FR-MOD09-001 a FR-MOD09-005 | FL-05, FL-09, FL-15; FL-04 y FL-16 a FL-19 cuando hay beneficios asociados |
| MOD-10 | FR-MOD10-001 a FR-MOD10-005 | FL-01, FL-04, FL-06, FL-10, FL-11, FL-12, FL-14 |
| MOD-11 | FR-MOD11-001 a FR-MOD11-006 | FL-08, FL-15; resultados registrados en FL-16 a FL-19 |
| MOD-12 | FR-MOD12-001 a FR-MOD12-005 | Todos, como control transversal de permisos y aislamiento |

## 11. Flujos y casos de uso

En todos los flujos se aplican aislamiento, permisos, trazabilidad y deduplicación. «Confirmar» requiere éxito registrado; un mensaje enviado o un intento de acción no equivalen a resultado final.

FL-01 describe captación por WhatsApp; FL-16 y FL-17 cubren reservas telefónicas y presenciales sin conversación digital. Los recorridos de cambios, finalización, pagos, paquetes y reportes se aplican a cualquier canal de origen. Un canal de reserva no presume preferencia de contacto ni consentimiento. Si el servicio requiere valoración se sigue FL-18 o FL-19; un precio estimado no impide reservar una valoración permitida y no se convierte en precio garantizado al confirmar la cita.

### FL-01 — Interesado consulta y se convierte en cliente

- **Actores:** interesado, IA y recepcionista cuando sea necesario.
- **Disparador:** consulta comercial por WhatsApp.
- **Precondiciones:** tenant y canal habilitados; catálogo autorizado disponible.
- **Secuencia principal:** 1) Se identifica contexto e intención. 2) Se responden dudas y recomiendan servicios habilitados. 3) Se aclaran preferencias y se consulta disponibilidad. 4) El interesado acepta servicio y condiciones. 5) Se identifica o crea perfil dentro del negocio y se ejecuta FL-02 o FL-03. 6) Se registra origen y vínculo conversación-reserva.
- **Resultado esperado:** cliente con reserva válida y oportunidad trazable. La conversión a reserva se distingue de una atención completada.
- **Alternativas y excepciones:** sin decisión, queda oportunidad para seguimiento permitido; sin información se aclara o deriva; sin disponibilidad se ofrecen alternativas o espera; si pide humano, FL-11; la falta de consentimiento promocional no impide solicitar una reserva.
- **Módulos y requisitos:** MOD-01, MOD-02, MOD-04, MOD-06, MOD-07, MOD-08, MOD-10, MOD-12; FR-MOD01-001 a 005, FR-MOD02-002, FR-MOD06-001 y 005, FR-MOD07-005.

### FL-02 — Reserva con anticipo obligatorio

**Aplicación a precios variables:** el importe del anticipo debe estar autorizado para el concepto y etapa correspondientes. Puede ser un importe fijo por valoración aunque el servicio posterior no tenga total confirmado; si depende del precio confirmado del servicio, se espera ese precio. Se conserva la distinción entre pago de valoración y anticipo de servicio. No se calcula un porcentaje sobre «desde» o rango como si fueran el total, ni se obliga a un porcentaje universal (FR-MOD05-006; OQ-PAY-04). La aceptación de condiciones de reserva no equivale a aceptación de un precio final todavía desconocido.

- **Actores:** cliente, IA o recepcionista, sistema y proveedor de pago.
- **Disparador:** aceptación de un servicio con anticipo obligatorio.
- **Precondiciones:** condiciones de anticipo, retención y cancelación definidas; medio habilitado; capacidad disponible.
- **Secuencia principal:** 1) Se revalida servicio, profesional, sucursal y recursos. 2) Se informa importe y condiciones. 3) Se crea solicitud y, si corresponde, retención temporal con vencimiento visible. 4) Se emite enlace asociado. 5) El cliente paga. 6) Se verifica evidencia confiable. 7) Se comprueba vigencia de capacidad y se confirma la cita. 8) Se actualizan saldo, historial y comunicaciones.
- **Resultado esperado:** cita confirmada y anticipo verificado una sola vez, con saldo pendiente explicable.
- **Alternativas y excepciones:** sin pago no se confirma; si no existe retención, se advierte y revalida al pagar; falla o pago tardío sigue FL-12; importe discordante queda en revisión; no se acredita por captura enviada por cliente; fallo de aviso no deshace una reserva ya confirmada y deja pendiente de comunicación.
- **Módulos y requisitos:** MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07, MOD-12; FR-MOD02-001 y 002, FR-MOD04-004, FR-MOD05-001 a 004, FR-MOD07-002.

### FL-03 — Reserva sin anticipo obligatorio

**Aplicación multicanal y variable:** la misma confirmación puede iniciarla un empleado tras llamada o visita al local. Sin precio final se conserva modalidad y necesidad de valoración; saldo total queda pendiente de definición. Sin contacto digital o sin permiso se registra la reserva y se comunica presencial o telefónicamente, sin exigir envío por WhatsApp (FR-MOD02-006 y 007, FR-MOD05-003).

- **Actores:** cliente, IA o recepcionista y sistema.
- **Disparador:** solicitud de reserva de un servicio sin anticipo obligatorio.
- **Precondiciones:** política definida, cliente identificado y disponibilidad válida.
- **Secuencia principal:** 1) Se aclaran servicio, ubicación, profesional y condiciones. 2) Se revalida capacidad. 3) El cliente acepta. 4) El sistema confirma sin exigir pago. 5) Se registra saldo o forma prevista de pago y se envían datos y recordatorios pertinentes.
- **Resultado esperado:** reserva confirmada sin convertir un anticipo opcional en obligación.
- **Alternativas y excepciones:** si el cliente elige pagar un anticipo opcional, su pago tiene estado separado; un fallo no cancela por sí solo la cita si la política no lo exige; conflicto de horario sigue FL-13; sin respuesta final del cliente se mantiene solicitud según política, sin confirmar silenciosamente.
- **Módulos y requisitos:** MOD-01, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07, MOD-12; FR-MOD02-001 y 002, FR-MOD04-004, FR-MOD07-002. Si hay anticipo opcional, también MOD-05 y FR-MOD05-001 a 003.

### FL-04 — Cambio o cancelación de cita

**Valoraciones y cotizaciones:** cancelar una valoración o servicio aplica su política específica, sin presumir que el cobro por valorar sea reembolsable o descontable. Cambiar precio antes de aceptación genera nueva versión; un importe ya aceptado no se sobrescribe. Si existen pagos parciales se registra diferencia, saldo por definir o importe para revisión y devolución aplicable, sin alterar evidencia del dinero cobrado (FR-MOD04-008, FR-MOD05-006; OQ-COM-05, OQ-COM-08).

- **Actores:** cliente, IA, recepcionista y sistema.
- **Disparador:** solicitud de cambio o cancelación.
- **Precondiciones:** identidad autorizada, cita localizable y política vigente identificada.
- **Secuencia principal:** 1) Se verifica identidad y estado. 2) Se presentan condiciones y efectos sobre pagos o beneficios. 3) Para cambio se buscan alternativas y se obtiene aceptación; para cancelación se confirma intención. 4) Se aplica transición válida sin perder cita original si el nuevo horario falla. 5) Se actualizan recursos, historial y avisos. 6) Se tramita devolución o restitución de beneficios cuando corresponda.
- **Resultado esperado:** modificación coherente y trazable, capacidad liberada o reasignada.
- **Alternativas y excepciones:** fuera de política se rechaza o deriva a excepción autorizada; no hay nuevo horario, se conserva anterior; pago no conciliado requiere revisión; solicitud duplicada no ejecuta otra devolución; no se declara devolución completada antes de evidencia.
- **Módulos y requisitos:** MOD-01, MOD-02, MOD-05, MOD-06, MOD-07, MOD-10, MOD-12; FR-MOD02-003, FR-MOD05-005, FR-MOD07-003. Si hay beneficios, también MOD-09 y FR-MOD09-002 y 003.

### FL-05 — Cita completada

**Alcance de finalización:** completar valoración registra su resultado comercial, no completa el servicio posterior. Cuando el precio del servicio sigue sin confirmar, la atención registrada no lo convierte en precio cero ni marca el saldo como liquidado. Los requisitos para iniciar el servicio y obtener aceptación del importe se aplican según la política que se resuelva, conservando evidencia (FR-MOD04-008, FR-MOD05-003; OQ-COM-07).

- **Actores:** profesional o recepcionista autorizados y sistema.
- **Disparador:** finalización efectiva del servicio.
- **Precondiciones:** cita identificada y transición permitida.
- **Secuencia principal:** 1) Se verifica servicio prestado. 2) El personal marca completada. 3) Se actualiza historial de servicios. 4) Se revisa saldo y se registran pagos verificados pendientes de registrar. 5) Se aplican movimientos elegibles de paquete o fidelización una sola vez. 6) Se habilita seguimiento poscita.
- **Resultado esperado:** atención registrada con situación financiera y beneficios diferenciados.
- **Alternativas y excepciones:** completar no implica declarar pagado; un saldo pendiente permanece visible; una inasistencia se registra como tal; una corrección de atención conserva evidencia y revisa beneficios; reintentar no consume otra sesión ni acredita más puntos.
- **Módulos y requisitos:** MOD-02, MOD-05, MOD-06, MOD-07, MOD-09, MOD-12; FR-MOD02-003, FR-MOD05-003, FR-MOD06-002, FR-MOD07-004, FR-MOD09-001 y 003.

### FL-06 — Poscita y encuesta de satisfacción

- **Actores:** sistema, cliente y recepcionista.
- **Disparador:** evento de cita completada y cumplimiento de condición temporal.
- **Precondiciones:** regla activa, contacto permitido y cita aún elegible.
- **Secuencia principal:** 1) Se revalida estado. 2) Se envía agradecimiento o encuesta según regla. 3) Se recibe respuesta vinculada a cita. 4) Se registra satisfacción. 5) Se aplica regla de solicitud de reseña. 6) Una experiencia negativa genera alerta para atención humana.
- **Resultado esperado:** seguimiento trazable, con pendiente visible si requiere intervención.
- **Alternativas y excepciones:** si se corrigió la cita a no completada, se suprime; sin respuesta no se inventa satisfacción; falla de canal queda registrada; promoción agregada requiere elegibilidad promocional; no se condiciona el registro de opiniones negativas a su publicación.
- **Módulos y requisitos:** MOD-06, MOD-07, MOD-08, MOD-10, MOD-12; FR-MOD06-005, FR-MOD07-001 y 004, FR-MOD10-002.

### FL-07 — Recordatorio de nueva visita

- **Actores:** sistema y cliente.
- **Disparador:** regla de mantenimiento o recurrencia no clínica basada en servicio anterior.
- **Precondiciones:** historial suficiente, intervalo definido y permiso de contacto según finalidad.
- **Secuencia principal:** 1) Se identifica cliente elegible. 2) Se comprueba que no tenga una reserva incompatible con el recordatorio. 3) Se verifica vigencia del servicio, consentimiento y frecuencia. 4) Se envía sugerencia con información autorizada. 5) Si acepta, se ejecuta reserva con disponibilidad actual.
- **Resultado esperado:** oportunidad de nueva visita registrada sin crear cita sin aceptación.
- **Alternativas y excepciones:** baja promocional suprime mensajes promocionales; servicio desactivado impide recomendación automática; sin respuesta se aplica límite configurado; no se presentan intervalos comerciales como consejo clínico.
- **Módulos y requisitos:** MOD-04, MOD-06, MOD-07, MOD-08, MOD-12; FR-MOD07-005, FR-MOD08-003, FR-MOD06-005; si reserva, MOD-01, MOD-02 y MOD-05 según FL-02/03.

### FL-08 — Campaña a clientes inactivos

- **Actores:** administrador, sistema y clientes elegibles.
- **Disparador:** preparación de campaña de recuperación.
- **Precondiciones:** definición de inactividad, contenido, oferta y criterio de atribución aprobados para la campaña.
- **Secuencia principal:** 1) Se construye segmento y se revisa audiencia. 2) Se excluyen bajas y faltas de consentimiento. 3) Se programa campaña con frecuencia y condiciones del canal. 4) Al enviar se revalida elegibilidad. 5) Se registran envíos, fallos y respuestas. 6) Las reservas resultantes se gestionan con flujos normales. 7) Se muestran reactivaciones observadas y atribuidas por separado.
- **Resultado esperado:** campaña medible y respetuosa de permisos, sin ingreso garantizado.
- **Alternativas y excepciones:** cliente ya reactivado se excluye si dejó de cumplir segmento; restricción de canal bloquea envío; una baja posterior a programación se respeta; un error parcial no duplica mensajes al reintentar; destinatarios no alcanzados se identifican.
- **Módulos y requisitos:** MOD-06, MOD-07, MOD-08, MOD-11, MOD-12; FR-MOD06-004 y 005, FR-MOD08-001 a 005, FR-MOD11-004 y 005.

### FL-09 — Compra o uso de paquete de sesiones

- **Actores:** cliente, recepcionista, sistema y proveedor de pago cuando aplique.
- **Disparador:** solicitud de compra o reserva con paquete existente.
- **Precondiciones:** paquete con servicios, sesiones, vigencia y reglas de consumo definidos; identidad del titular verificada.
- **Secuencia principal:** 1) Para compra se presentan condiciones y registra pago. 2) Tras verificación se activa saldo de sesiones. 3) Para uso se comprueba titularidad, vigencia, servicio y saldo. 4) Se reserva mediante agenda normal. 5) Se compromete o consume saldo en el momento configurado. 6) Se conserva vínculo con cita y movimiento.
- **Resultado esperado:** paquete pagado y sesiones reconstruibles sin doble uso.
- **Alternativas y excepciones:** pago pendiente no activa saldo; vencimiento o saldo insuficiente bloquea consumo; intentos concurrentes no sobreconsumen; cancelación o inasistencia aplica la política aprobada y no una restitución automática inventada; corrección se registra con permiso y motivo.
- **Módulos y requisitos:** MOD-02, MOD-04, MOD-05, MOD-06, MOD-09, MOD-12; FR-MOD09-002 y 003, FR-MOD05-002 y 003, FR-MOD02-002 y 003.

### FL-10 — Cambio de disponibilidad profesional

- **Actores:** profesional autorizado, administrador, recepcionista y sistema.
- **Disparador:** modificación de horario, descanso, ausencia o ubicación.
- **Precondiciones:** profesional registrado y permiso para el alcance solicitado.
- **Secuencia principal:** 1) Se ingresa cambio. 2) Se valida coherencia entre ubicaciones y recursos. 3) Se identifican citas afectadas. 4) Se aplica restricción a nuevas reservas. 5) Se presentan conflictos al personal. 6) Se resuelven mediante propuesta y aceptación de cambios cuando corresponda. 7) Se registra historial y avisos.
- **Resultado esperado:** disponibilidad real actualizada con citas existentes protegidas y conflictos visibles.
- **Alternativas y excepciones:** sin permiso se rechaza; citas en conflicto no se cancelan silenciosamente; si falta reemplazo se deriva a atención humana; una oferta de horario previa se revalida antes de confirmar; detalles de traslado entre sucursales dependen de política pendiente.
- **Módulos y requisitos:** MOD-02, MOD-03, MOD-07, MOD-10, MOD-12; FR-MOD03-002 a 005, FR-MOD02-004, FR-MOD07-003.

### FL-11 — Transferencia de IA a humano

- **Actores:** cliente, IA y recepcionista.
- **Disparador:** petición humana, ambigüedad persistente, excepción o necesidad de autorización.
- **Precondiciones:** conversación identificada y bandeja habilitada.
- **Secuencia principal:** 1) Se registra motivo. 2) Se marca pendiente y asigna responsable o cola. 3) Se pausa respuesta conversacional de IA. 4) El humano consulta contexto permitido y toma control. 5) Responde y resuelve o escala. 6) Devuelve control explícitamente si corresponde.
- **Resultado esperado:** conversación atendible sin competencia entre respuestas manuales y automáticas.
- **Alternativas y excepciones:** sin personal disponible permanece pendiente y se comunica el estado si el canal lo permite; no se promete atención humana inmediata; una respuesta de IA en preparación se suprime antes de despacho; fallo de asignación genera alerta; recordatorios operativos independientes siguen su política específica.
- **Módulos y requisitos:** MOD-01, MOD-10, MOD-12; FR-MOD01-005, FR-MOD10-001 a 005.

### FL-12 — Pago fallido o confirmado tras vencer retención

- **Actores:** cliente, proveedor de pago, sistema y personal autorizado.
- **Disparador:** fallo de pago o evidencia de pago posterior a expiración de retención.
- **Precondiciones:** solicitud identificable y vencimiento conocido si hubo retención.
- **Secuencia principal:** 1) Se verifica origen y relación del evento. 2) Se registra pago fallido o verificado tardío. 3) Se comprueba estado actual de cita y capacidad. 4) Fallo no confirma ni acredita saldo. 5) Pago tardío se mantiene como dinero recibido separado de confirmación. 6) Se resuelve con nueva disponibilidad aceptada o devolución aplicable mediante personal/regla autorizada. 7) Se informa resultado comprobado.
- **Resultado esperado:** fondos y reserva conciliables sin ocupar un horario ya comprometido.
- **Alternativas y excepciones:** si se permite recuperar horario todavía libre, exige revalidación y condiciones aprobadas; si otro cliente lo ocupó, no se desplaza; notificación repetida no duplica importe ni devolución; discordancia de evidencia o indisponibilidad externa queda en revisión visible.
- **Módulos y requisitos:** MOD-02, MOD-05, MOD-10, MOD-12; FR-MOD05-002, 004 y 005, FR-MOD02-002, FR-MOD10-002.

### FL-13 — Dos clientes solicitan el mismo horario

**Concurrencia multicanal:** uno de los intentos puede provenir de WhatsApp y otro de un empleado que recibe una llamada o atiende en el local; todos compiten por la misma capacidad. Esta comprobación es obligatoria también con IA inactiva y durante la recuperación del canal (FR-MOD02-002 y 007).

- **Actores:** dos clientes, IA o recepcionistas y sistema.
- **Disparador:** intentos concurrentes sobre capacidad incompatible.
- **Precondiciones:** mismo profesional, recurso u otra capacidad limitada; solicitudes válidas individualmente.
- **Secuencia principal:** 1) Ambos consultan disponibilidad. 2) Cada operación revalida al comprometer capacidad. 3) El sistema admite solo las reservas o retenciones compatibles con la capacidad configurada. 4) A quien pierde disponibilidad se informa y ofrecen alternativas o espera. 5) Se registran resultados y referencias de operación.
- **Resultado esperado:** no hay sobreventa aunque la disponibilidad consultada antes pareciera libre para ambos.
- **Alternativas y excepciones:** reintento de la operación ganadora recupera su resultado sin otra cita; expiración de retención libera capacidad para nueva validación; pago recibido sin capacidad sigue FL-12; un recurso con capacidad compartida permite únicamente las asignaciones compatibles con su capacidad real.
- **Módulos y requisitos:** MOD-02, MOD-03, MOD-12; FR-MOD02-001, 002 y 005, FR-MOD03-004. Si hay cobro o retención, MOD-05 y FR-MOD05-004.

### FL-14 — Baja de comunicaciones promocionales

- **Actores:** cliente, IA o recepcionista y sistema.
- **Disparador:** petición de dejar de recibir promociones.
- **Precondiciones:** destinatario identificable dentro del negocio.
- **Secuencia principal:** 1) Se reconoce alcance de la solicitud. 2) Se registra baja, origen y momento. 3) Se excluye al cliente de campañas y seguimientos promocionales pendientes. 4) Se confirma actualización cuando sea posible. 5) Se conserva historial y se mantienen separadas las comunicaciones operativas permitidas.
- **Resultado esperado:** no se despachan nuevas promociones al destinatario dado de baja.
- **Alternativas y excepciones:** solicitud ambigua se aclara o deriva suspendiendo promociones; mensajes ya despachados se identifican como tales; falla de registro deja pendiente humano y bloqueo de nuevos despachos hasta resolver; nueva autorización futura exige evidencia, no se deduce de una nueva reserva.
- **Módulos y requisitos:** MOD-01, MOD-06, MOD-07, MOD-08, MOD-10, MOD-12; FR-MOD06-005, FR-MOD08-003 y 004, FR-MOD07-005.

### FL-15 — Consulta de resultados del negocio

**Desgloses de la revisión:** incluir reservas de todos los canales y distinguir origen, usuario que registra y contactos posteriores. Mostrar valoración, cotización y servicio posterior por separado, junto con precio orientativo, importe confirmado y dinero cobrado; un total desconocido no se suma como cero ni ingreso y no tiene saldo total calculable hasta definirse (FR-MOD11-003 y 006).

- **Actores:** propietario o administrador autorizado y sistema.
- **Disparador:** consulta de desempeño comercial y operativo.
- **Precondiciones:** acceso autorizado, período y alcance seleccionados; definiciones de métricas visibles.
- **Secuencia principal:** 1) Se elige período, sucursal y otros filtros permitidos. 2) Se muestran embudo, citas, ocupación, servicios, pagos y recurrencia. 3) Se consultan campañas y automatizaciones. 4) Se revisan definiciones, cobertura y estados de actualización. 5) Se distinguen hechos, atribución y estimaciones y se contrastan con registros autorizados.
- **Resultado esperado:** resultados interpretables sin presentar asociaciones como ingresos causados por IA.
- **Alternativas y excepciones:** falta de datos se informa; denominador cero no produce una tasa engañosa; pagos pendientes no se incluyen como cobrados; reservas múltiples o canales concurrentes siguen reglas de deduplicación y atribución definidas; sin permiso financiero se restringen esos datos.
- **Módulos y requisitos:** MOD-05, MOD-06, MOD-08, MOD-09, MOD-11, MOD-12; FR-MOD11-001 a 005, FR-MOD05-003 y 005, FR-MOD12-002.

### FL-16 — Reserva recibida por teléfono

- **Actores:** cliente por llamada y recepcionista autorizada.
- **Disparador:** llamada para reservar un servicio o valoración.
- **Precondiciones:** panel y agenda disponibles, servicio configurado y usuario con permiso; no se requiere WhatsApp ni IA.
- **Secuencia principal:** 1) El empleado busca cliente por datos disponibles y confirma coincidencia o lo registra sin salir del recorrido. 2) Selecciona origen teléfono, servicio, sucursal y profesional. 3) Consulta agenda común y comunica modalidad de precio y condiciones, incluida valoración si corresponde. 4) Registra preferencias de comunicación y aceptación aplicable sin presumir consentimiento promocional. 5) Ejecuta reserva y anticipo, si corresponde, con las mismas validaciones de todos los canales. 6) Comunica por llamada el estado real y deja historial, pagos y beneficios relacionados.
- **Resultado esperado:** reserva telefónica en agenda central con cliente y origen trazables, utilizable por CRM, fidelización y reportes.
- **Alternativas y excepciones:** coincidencias ambiguas se revisan sin fusionar automáticamente; falta de contacto WhatsApp no impide guardar; error de campo conserva datos válidos e indica corrección; conflicto sigue FL-13; anticipo no verificado deja estado no confirmado si es obligatorio; si el canal digital falla, solo queda pendiente el aviso permitido, no la operación manual independiente.
- **Módulos y requisitos:** MOD-02, MOD-03, MOD-04, MOD-06, MOD-12; MOD-05, MOD-07 y MOD-09 cuando corresponda; resultados en MOD-11. FR-MOD02-002, 006 y 007; FR-MOD06-001 y 006; FR-MOD04-006; FR-MOD07-006; FR-MOD11-006.

### FL-17 — Reserva presencial registrada en el panel

- **Actores:** cliente en el local y empleado autorizado.
- **Disparador:** solicitud presencial de una cita.
- **Precondiciones:** panel disponible y configuración suficiente; no hay obligación de interacción digital previa.
- **Secuencia principal:** 1) El empleado busca o crea cliente durante el registro. 2) Marca origen presencial y selecciona servicio o valoración, profesional, ubicación y horario. 3) Revisa disponibilidad compartida y presenta condiciones y modalidad de precio. 4) Registra decisión del cliente y aplica regla de anticipo si existe. 5) Guarda cita con su estado real. 6) Comunica los datos en persona y registra preferencias para futuros avisos; el historial queda disponible para atención, beneficios y reportes.
- **Resultado esperado:** reserva presencial consistente con las telefónicas y de WhatsApp, sin requerir cuenta ni mensajes digitales.
- **Alternativas y excepciones:** con atención inmediata se valida capacidad actual; si se trata de una valoración directa se sigue FL-19; sin permiso de contacto se suprimen avisos, sin impedir cita; saldo de paquete insuficiente o anticipo fallido se resuelve con las mismas reglas; ausencia de disponibilidad ofrece alternativa o espera sin sobreventa.
- **Módulos y requisitos:** MOD-02, MOD-03, MOD-04, MOD-06, MOD-12; MOD-05, MOD-07 y MOD-09 según operación; resultados en MOD-11. FR-MOD02-001, 002, 006 y 007; FR-MOD06-001 y 006; FR-MOD07-002 y 006; FR-MOD11-006.

### FL-18 — Servicio sujeto a valoración y reserva posterior

- **Actores:** cliente, IA o recepcionista, profesional y personal con permiso para confirmar precio; sistema de pago si aplica.
- **Disparador:** interés en servicio sin precio definitivo previo a evaluación presencial.
- **Precondiciones:** modalidad publicada, valoración configurada como gratuita o pagada con duración y profesional; políticas de anticipo y facultades de precio definidas para las acciones a ejecutar.
- **Secuencia principal:** 1) Se comunica que el precio del servicio requiere valoración; desde o rango, si se informan, conservan su carácter orientativo. 2) Se agenda valoración aplicando FL-02 o FL-03 según su propio cobro. 3) El profesional realiza valoración y registra resultado comercial no médico. 4) Personal autorizado confirma importe y emite propuesta del servicio vinculada a valoración y cliente. 5) Se ofrece al cliente y registra aceptación o rechazo de versión e importe, con condiciones aplicables. 6) Si acepta reservar, se valida capacidad y genera cita posterior relacionada, aplicando anticipo configurado. 7) Se vinculan cotización, pagos parciales y cobro de valoración; cualquier descuento posterior solo se aplica si está configurado.
- **Resultado esperado:** valoración conservada y servicio posterior reservable con propuesta y decisión trazables; orientativo, confirmado y cobrado permanecen distintos.
- **Alternativas y excepciones:** el cliente puede no continuar; cotización emitida no se considera aceptada por silencio; revisión previa a aceptación genera nueva versión y se comunica; precio final puede salir del rango si este no era garantizado, explicando cambio sin sustituir aceptación; si había garantía, desviación se bloquea o deriva para resolver compromiso mediante cambio explícito aceptado; cancelaciones y pagos tardíos siguen políticas por concepto; sin horario posterior queda propuesta sin reserva; precio confirmado distinto de pagos parciales deja diferencia visible y no un cierre ficticio.
- **Módulos y requisitos:** MOD-01 cuando interviene IA, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-12; MOD-07 según elegibilidad, MOD-09 si existen beneficios; resultados en MOD-11. FR-MOD01-006, FR-MOD02-008, FR-MOD04-006 a 008, FR-MOD05-003 y 006, FR-MOD06-006, FR-MOD07-006, FR-MOD11-006.

### FL-19 — Valoración presencial sin reserva previa

- **Actores:** cliente que llega al local, recepcionista y profesional o personal autorizado.
- **Disparador:** petición de valoración directamente en el establecimiento, o registro autorizado de una valoración efectivamente realizada sin cita previa.
- **Precondiciones:** panel disponible, cliente identificable, valoración configurada y permisos; no se requiere reserva digital ni conversación previa.
- **Secuencia principal:** 1) Se busca cliente o registra nuevo con origen presencial. 2) Si la atención va a comenzar, se valida disponibilidad actual de profesional y recursos y registra atención; si ya ocurrió, se documentan tiempos reales sin fabricar reserva previa. 3) Se informa y registra gratuidad o cobro autorizado de valoración. 4) Se guarda resultado comercial no médico. 5) Se confirma precio por actor facultado, ofrece servicio y registra decisión sobre la versión. 6) Si el cliente quiere continuar en otra cita, se valida disponibilidad y genera reserva posterior vinculada según FL-18. 7) Se relacionan pagos y preferencias y se refleja actividad en CRM y reportes.
- **Resultado esperado:** valoración presencial trazable y posibilidad de conversión posterior, con o sin uso de WhatsApp.
- **Alternativas y excepciones:** sin capacidad actual se ofrece agendar; un conflicto detectado al registrar actividad ya realizada queda para revisión y no sobrescribe citas anteriores; sin aceptación no se crea reserva ni se inventa cobro; pago parcial, cancelación o cambio de precio conserva historial y requiere resolución según reglas; sin contacto digital el registro y la atención continúan y los mensajes no elegibles se suprimen.
- **Módulos y requisitos:** MOD-02, MOD-03, MOD-04, MOD-05 si hay cobro, MOD-06, MOD-12; MOD-07 y MOD-09 cuando corresponda; resultados en MOD-11. FR-MOD02-006 a 008, FR-MOD04-007 y 008, FR-MOD05-006, FR-MOD06-006, FR-MOD07-006, FR-MOD11-006.

## 12. Reglas de negocio

| ID | Regla | Naturaleza y trazabilidad |
| --- | --- | --- |
| RN-01 | Ninguna cita confirmada ni retención válida puede exceder la capacidad compatible de profesional, sucursal y recursos, incluidas duración y preparación. | Confirmada; FR-MOD02-001 y 002; FL-13 |
| RN-02 | Un pago solo se acredita con evidencia de fuente confiable, coincidente con operación, importe, moneda y destinatario. | Confirmada; FR-MOD05-002; medios en OQ-PAY-02 |
| RN-03 | Repetir una misma operación o evento no debe duplicar reserva, cobro, devolución, comunicación, puntos ni consumo de sesiones. | Confirmada; FR-MOD02-002, FR-MOD05-002 a 005, FR-MOD07-001, FR-MOD09-001 a 005 |
| RN-04 | Anticipos obligatorios y opcionales se comportan según política del negocio; un anticipo obligatorio no verificado impide confirmar. | Capacidad confirmada, parámetros pendientes; OQ-PAY-01 |
| RN-05 | Cada empleado y la IA actúan con permisos vigentes y alcance autorizado. | Confirmada; FR-MOD12-002 |
| RN-06 | Ningún dato, contexto, reporte, mensaje u operación de un tenant debe exponerse a otro sin una autorización específica que no se presupone. | Confirmada; FR-MOD12-004; frontera exacta OQ-PRO-02 |
| RN-07 | La IA no modifica precios, descuentos, disponibilidad, políticas ni resultados de pago por iniciativa propia. | Confirmada; FR-MOD01-002 y 005 |
| RN-08 | La elegibilidad promocional se comprueba al programar y antes de despachar; una baja prevalece sobre una selección anterior. | Confirmada; FR-MOD06-005, FR-MOD08-003 y 004 |
| RN-09 | Automatizaciones revalidan estado actual de cita y cliente; cancelada o reagendada no conserva avisos incompatibles. | Confirmada; FR-MOD07-001 a 005 |
| RN-10 | Campañas, seguimiento y respuestas se coordinan para evitar mensajes repetidos o contradictorios; los límites de frecuencia y horarios se configuran cuando estén definidos. | Capacidad confirmada, parámetros en OQ-MKT-02 |
| RN-11 | Un cliente puede tener varias citas e interacciones; deduplicar operaciones no significa limitarlo a una sola cita. | Confirmada; FR-MOD06-001 |
| RN-12 | Paquetes, puntos y beneficios mantienen saldo reconstruible y no permiten doble redención ni consumo superior al disponible. | Confirmada; FR-MOD09-001 a 005 |
| RN-13 | Reservas, pagos, devoluciones, beneficios, permisos y acceso de soporte conservan trazabilidad; correcciones no borran su historia. | Confirmada; FR-MOD12-004 y 005 |
| RN-14 | Pago y cita son estados distintos: pagar tarde no otorga un horario ocupado; completar servicio no verifica el pago. | Confirmada; FR-MOD05-004; FL-05 y FL-12 |
| RN-15 | Una propuesta de horario, cambio o servicio no es confirmación; se comunica el resultado que efectivamente registró el sistema. | Confirmada; FR-MOD01-005, FR-MOD07-003 |
| RN-16 | Cambios en disponibilidad muestran citas afectadas y no cancelan ni trasladan silenciosamente reservas existentes. | Confirmada; FR-MOD03-002; FL-10 |
| RN-17 | Descuentos, promociones y beneficios solo se acumulan si existe regla autorizada; una ambigüedad exige resolución antes de aplicarlos. | Configurable; OQ-COM-02, OQ-LOY-01 |
| RN-18 | Las condiciones aceptadas quedan asociadas a la operación; una nueva versión del catálogo no cambia acuerdos previos sin gestión explícita. | Propuesta funcional V1 para revisión; FR-MOD04-002 |
| RN-19 | Pausa conversacional humana impide respuestas automáticas competidoras; el alcance sobre avisos operativos se define por finalidad y política. | Capacidad confirmada; OQ-EXP-01 |
| RN-20 | El CRM excluye historias clínicas y procesamiento médico especializado; observaciones y recomendaciones se limitan al propósito no médico. | Confirmada; FR-MOD06-003, FR-MOD01-003 |
| RN-21 | Una devolución o renovación se informa como completada solo con evidencia del resultado; se distinguen solicitud, pendiente y finalización. | Confirmada; FR-MOD05-005, FR-MOD09-004 |
| RN-22 | Reglas de consumo de paquetes ante cancelación, inasistencia y finalización deben definirse antes de activar el programa. | Configurable pendiente; OQ-LOY-02 |
| RN-23 | Los reportes separan hechos, atribución y estimación; asociación con IA o campaña no demuestra causalidad. | Confirmada; FR-MOD11-001 a 005 |
| RN-24 | Políticas del canal y protección de datos deben validarse en su versión vigente antes de habilitar comunicaciones; tener una conversación no presume permiso promocional. | Confirmada como obligación funcional; validación pendiente OQ-MKT-01, OQ-SEC-01, OQ-INT-01 |
| RN-25 | Cobros de servicios a clientes y cobros de suscripción SaaS tienen conceptos, destinatarios e historiales diferenciados. | Confirmada; FR-MOD05-003, FR-MOD12-003 |

### 12.1 Reglas adicionales de operación multicanal y precios

| ID | Regla | Naturaleza y trazabilidad |
| --- | --- | --- |
| RN-26 | Reservas telefónicas, presenciales y de WhatsApp comparten capacidad y validaciones; origen se distingue de usuario registrador y contactos posteriores. | Confirmada; FR-MOD02-002, 006 y 007; FL-13, FL-16 y FL-17 |
| RN-27 | Agenda y operaciones manuales independientes siguen disponibles sin configurar IA/WhatsApp o durante su fallo, siempre que panel y plataforma estén disponibles. | Confirmada; FR-MOD02-007, FR-MOD12-001 |
| RN-28 | CRM, pagos, fidelización y reportes no dependen del canal de reserva; reservar por teléfono o en persona no otorga consentimiento ni obliga a WhatsApp. | Confirmada; FR-MOD06-006, FR-MOD07-006, FR-MOD11-006 |
| RN-29 | Cada servicio admite modalidad fijo, desde, rango o sujeto a valoración. Orientativo no significa garantizado; rango solo es vinculante si existe compromiso explícito. | Confirmada; FR-MOD04-006, FR-MOD01-006 |
| RN-30 | Precio orientativo, confirmado, aceptado e importe cobrado son hechos distintos. Un total desconocido se indica pendiente de definición, no cero, ingreso o saldo final calculado. | Confirmada; FR-MOD04-008, FR-MOD05-003, FR-MOD11-003 |
| RN-31 | Valoración gratuita o pagada tiene duración y profesional; puede registrarse sin cita previa y originar servicio posterior sin perder su identidad ni crear una reserva retroactiva ficticia. | Confirmada; FR-MOD02-008, FR-MOD04-007; FL-18 y FL-19 |
| RN-32 | Solo personal facultado confirma o modifica precio; cambios conservan versión, autor, motivo, momento y decisión del cliente. Una propuesta revisada no sustituye silenciosamente un importe aceptado. | Capacidad confirmada, facultades y condiciones pendientes; OQ-COM-06 a 08 |
| RN-33 | Un anticipo necesita importe autorizado para un concepto, pero no necesariamente total definitivo del servicio. No se impone porcentaje universal ni se calcula sobre una estimación como total cierto. | Confirmada; FR-MOD05-006; OQ-PAY-04 |
| RN-34 | Cobro por valorar no se descuenta del servicio por defecto. Si se autoriza aplicarlo, se conserva su origen y no se registra de nuevo como dinero recibido. | Configurable pendiente; OQ-COM-05; FR-MOD05-006 |
| RN-35 | Completar valoración no completa servicio posterior, no prueba aceptación de cotización ni liquida saldo. Mensajes y reportes conservan esta separación. | Confirmada; FR-MOD06-006, FR-MOD07-006, FR-MOD11-006 |
| RN-36 | Cancelaciones, pagos parciales, excedentes y diferencias entre precio confirmado y cobrado requieren resolución trazable; no se igualan modificando el pasado ni cobrando automáticamente una revisión no aceptada. | Confirmada, políticas pendientes; OQ-COM-08, OQ-PAY-03 y 04 |

## 13. Requisitos no funcionales preliminares

Estos requisitos describen comportamientos esperados sin definir arquitectura. Los objetivos numéricos, entornos de validación y mecanismos concretos deben acordarse antes de evaluar los atributos correspondientes.

En RNF-06 y RNF-12 se comprobará que el fallo o ausencia de IA/WhatsApp no impide operar agenda manual cuando la plataforma central está disponible, y que recuperar el canal no duplica efectos. En RNF-07 se evaluará con empleados de poca familiaridad tecnológica el recorrido de búsqueda/alta, selección, revisión y guardado de reserva telefónica o presencial; errores deben indicar corrección y conservar datos válidos. Perfiles de prueba y umbrales de éxito o duración quedan en OQ-EXP-05, sin inventar valores. Los RNF de integridad y pruebas incluyen concurrencia entre canales, revisión de cotización, pagos parciales y aplicación del cobro de valoración sin doble conteo.

| ID | Área y requisito | Evidencia preliminar de aceptación | Decisiones pendientes |
| --- | --- | --- | --- |
| RNF-01 | Seguridad: verificar identidad, permisos y alcance en lectura y cambio, incluidos accesos administrativos e IA. | Intentos sin autorización se rechazan y quedan registrados sin revelar datos privados. | OQ-SEC-03; mecanismos posteriores |
| RNF-02 | Privacidad: tratar datos pertinentes para finalidades definidas, gestionar preferencias y solicitudes sobre datos. | Se identifican finalidad, acceso y tratamiento de una solicitud; no se incluye función clínica. | OQ-SEC-01 y 02; revisión normativa |
| RNF-03 | Aislamiento multitenant: aplicar la frontera en todos los módulos y contextos de IA. | Pruebas cruzadas de consultas, cambios, reportes, adjuntos y mensajes no exponen información ajena. | OQ-PRO-02, OQ-ARC-01 |
| RNF-04 | Confiabilidad: tolerar eventos repetidos, fallos parciales y reintentos sin efectos duplicados. | Repetir confirmación de pago o cita conserva una operación y un saldo correcto. | OQ-ARC-01 y 02 |
| RNF-05 | Integridad transaccional: impedir conflictos de capacidad y saldos aunque haya concurrencia. | FL-12, FL-13 y redenciones concurrentes mantienen invariantes de agenda y beneficios. | Mecanismos en M0.2 y diseño posterior |
| RNF-06 | Disponibilidad: atención automática en cualquier horario con estado de conexiones y contingencia visible. | Ante caída del canal o IA se conserva o identifica trabajo pendiente y no se promete éxito ficticio. | Objetivo de disponibilidad, períodos y escalamiento en OQ-ARC-02 |
| RNF-07 | Accesibilidad y usabilidad: permitir completar tareas principales con etiquetas, navegación y estados comprensibles. | Se recorren reserva manual, toma humana y baja sin depender solo de color; errores indican cómo corregir; se valida uso con teclado y contextos acordados. | Dispositivos, estándar y evaluación con usuarios en OQ-EXP-03 |
| RNF-08 | Observabilidad: poder reconstruir una operación y distinguir fallo interno, externo o dato pendiente. | Una incidencia enlaza conversación, cita, pago o regla cuando corresponda; registros no exponen secretos ni contexto privado innecesario. | Retención, alertas y acceso en OQ-SEC-02, OQ-ARC-03 |
| RNF-09 | Rendimiento: mantener operación de consultas, reservas, bandeja y reportes bajo carga representativa. | Se miden tiempos y errores contra escenarios y objetivos previamente acordados; no se declara cumplimiento sin umbrales aprobados. | Latencia, volumen, concurrencia y tamaño del catálogo en OQ-ARC-03 |
| RNF-10 | Mantenibilidad: permitir evolución incremental de políticas y módulos sin perder comportamiento acordado. | Cambiar una regla autorizada mantiene trazabilidad y supera regresiones relevantes; decisiones pendientes siguen identificables. | Tecnologías y estrategia en OQ-ARC-01 |
| RNF-11 | Pruebas: verificar criterios funcionales, permisos, aislamiento y fallos de integraciones. | Escenarios positivos, negativos y concurrentes cubren reservas, pagos, baja y redención; no basta comprobar pantallas ideales. | Estrategia y entornos posteriores, OQ-ARC-01 |
| RNF-12 | Recuperación ante fallos: recuperar información y reanudar operaciones con conciliación y sin duplicación. | Un ejercicio de recuperación comprueba integridad de agenda, dinero y beneficios, e identifica eventos pendientes. | Pérdida tolerable de datos, tiempo de recuperación y procedimiento en OQ-ARC-02 |
| RNF-13 | Costos variables: medir consumo de IA, mensajes y otros servicios y aplicar controles definidos. | Uso se atribuye al tenant sin mezclar cobros de clientes; límites y alertas responden a política; costos desconocidos se indican como tales. | OQ-BIZ-02, OQ-INT-01, OQ-ARC-03 |
| RNF-14 | Credenciales: restringir acceso, evitar exposición y permitir revocación o sustitución de conexiones. | Secretos no aparecen en conversaciones, notas ni reportes; revocar conexión impide su uso posterior y muestra estado operativo. | Gestión y responsabilidades en OQ-SEC-03, OQ-INT-01 |
| RNF-15 | Control humano: pausar, supervisar y resolver excepciones sin eludir validaciones críticas. | FL-11 detiene respuestas automáticas competidoras; una corrección humana requiere permiso y deja evidencia. | OQ-EXP-01, OQ-COM-01 |

## 14. Experiencia integral del cliente

| Etapa | Experiencia esperada | Continuidad y control |
| --- | --- | --- |
| Captación | Recibe respuesta contextual con oferta real | Origen y oportunidad registrados; no se presume consentimiento promocional |
| Conversión | Obtiene orientación comercial y alternativas pertinentes | Puede pedir humano, rechazar complementos o no continuar |
| Reserva | Elige condiciones y disponibilidad validadas | Se explicita si está solicitada, retenida o confirmada |
| Pago | Conoce monto, concepto y saldo | Se informa verificación, fallo o revisión sin confundirlo con estado de cita |
| Atención | Recibe indicaciones y avisos consistentes; puede cambiar según política | Personal conoce cita y contexto pertinente, no datos privados innecesarios |
| Poscita | Puede expresar satisfacción y solicitar atención por una mala experiencia | No se finge respuesta ni se pierde el pendiente humano |
| Fidelización | Consulta y utiliza beneficios elegibles | Movimientos, vencimientos y sesiones explicables |
| Reactivación | Recibe propuestas pertinentes si está autorizado | Puede darse de baja; frecuencia coordinada entre módulos |
| Recompra | Reserva otra vez sin perder historial | Nueva validación de disponibilidad, precios y beneficios |

No se exige crear una cuenta de cliente final como decisión cerrada: la identificación y verificación del canal se resolverán en OQ-EXP-03. Una conversación iniciada en WhatsApp y continuada por personal mantiene el contexto autorizado y el estado real de las operaciones.

La entrada al recorrido también puede ser una llamada o visita al local. El empleado registra en el panel y confirma por el medio disponible; falta de WhatsApp no impide atención ni acceso a beneficios. La reserva guarda origen y el CRM conserva preferencias para comunicaciones posteriores, sin convertir el origen en consentimiento.

Para precio variable, la experiencia puede recorrer consulta → valoración gratuita o pagada → propuesta de precio confirmado → decisión del cliente → reserva posterior → pagos y atención. La valoración directa en el local entra en el mismo recorrido sin crear captación digital ficticia. El cliente ve si un importe es orientativo, confirmado o pagado; recibe una nueva propuesta ante revisión y puede no continuar.

## 15. Dependencias funcionales entre módulos

| Capacidad | Dependencias necesarias | Regla de integración |
| --- | --- | --- |
| Configuración del negocio | MOD-12 → MOD-03 y MOD-04 | No se ofrece como reservable lo que aún carece de configuración suficiente |
| Recepción comercial | MOD-01 consulta MOD-04, MOD-02 y MOD-06; deriva a MOD-10 | La respuesta usa información autorizada; no crea hechos por generación de texto |
| Reserva y cobro | MOD-02 coordina MOD-03, MOD-04, MOD-05 y MOD-06 | Verificar pago no evita validar capacidad; falla parcial queda como excepción trazable |
| Seguimiento | MOD-07 consulta MOD-02, MOD-06 y MOD-08 | Estado actual y preferencias prevalecen sobre programación previa |
| Campañas | MOD-08 usa MOD-06, MOD-04 y MOD-09; mide en MOD-11 | Selección, envío y redención son controles distintos |
| Beneficios | MOD-09 usa MOD-02 y MOD-05; refleja en MOD-06 | Atención y dinero son hechos separados que activan reglas explícitas |
| Atención humana | MOD-10 coordina MOD-01 y MOD-07 | Toma de control explícita y alcance de pausa definido |
| Resultados | MOD-11 usa hechos de MOD-01 a MOD-10 | No reconstruye ventas exitosas desde mensajes sin operación verificada |
| Administración | MOD-12 atraviesa todos los módulos | Permisos, aislamiento, límites y auditoría no son controles opcionales por canal |

Estas dependencias permiten implementar recorridos completos por incrementos. No especifican servicios técnicos, bases de datos ni interfaces de programación.

La agenda manual depende de configuración, identidad, permisos y capacidad de la plataforma, pero no de conexión de WhatsApp ni ejecución de IA. MOD-02 y MOD-06 coordinan búsqueda, alta y origen para que MOD-05, MOD-09 y MOD-11 operen de igual manera con todos los canales. MOD-04 proporciona modalidad, valoración y cotización; MOD-05 cobra conceptos autorizados, MOD-06 relaciona historial y MOD-07 revalida tanto estado de valoración como decisión sobre propuesta. Ningún mensaje puede sustituir la evidencia de aceptación, precio confirmado o pago. Una reserva posterior depende de disponibilidad propia, no solo de que se haya completado una valoración.

## 16. Métricas e indicadores

Cada reporte debe mostrar período, filtros, definición, cobertura, momento de actualización y límites de interpretación. Las definiciones siguientes son propuestas operativas para revisión; ventanas, cohortes, reglas de atribución y metas no están aprobadas (OQ-PRO-03, OQ-MKT-03, OQ-ARC-03). Si un denominador es cero se informa «sin base de cálculo».

| ID | Indicador y base propuesta | Tipo y precaución |
| --- | --- | --- |
| MET-01 | Conversaciones recibidas: conversaciones con al menos un mensaje entrante válido en período, deduplicadas según definición acordada | Observado; sesión conversacional pendiente de definición |
| MET-02 | Interesados comerciales: clientes/conversaciones con intención comercial identificada y fuente registrada | Clasificación observada o inferida por IA, identificada como tal; unidad pendiente |
| MET-03 | Conversión: interesados elegibles con reserva confirmada vinculada / interesados elegibles en cohorte definida | Atribución; ventana y tratamiento de varias reservas pendientes |
| MET-04 | Reservas gestionadas por IA: citas con acción de IA registrada; separar creadas por IA, asistidas y tomadas por humano | Observado por intervención; no representa ingresos incrementales |
| MET-05 | Confirmadas, completadas, canceladas e inasistencias: conteos separados por estado y fecha de referencia explícita | Observado; distinguir estado actual de transiciones del período |
| MET-06 | Ocupación: tiempo reservado o atendido elegible / tiempo operativo disponible según variante elegida | Cálculo sobre hechos; preparación, bloqueos y recursos deben explicitarse |
| MET-07 | Demanda por horario y servicios populares: solicitudes registradas y servicios reservados/completados en series separadas | Observado con cobertura parcial; lo no registrado no equivale a demanda cero |
| MET-08 | Importes verificados cobrados, devueltos y pendientes; valor de reservas en serie distinta | Observado; evitar doble conteo de anticipos, paquetes y sesiones |
| MET-09 | Clientes nuevos y recurrentes: primera visita elegible frente a visita con antecedente elegible | Cálculo observado; definición de visita y alcance histórico pendientes |
| MET-10 | Frecuencia: visitas elegibles por cliente y período, o intervalo entre ellas con método explícito | Cálculo; no extrapolar clientes sin historial |
| MET-11 | Reactivaciones: clientes que vuelven a evento elegible tras cumplir criterio de inactividad | Observado; vincular una campaña no demuestra causalidad |
| MET-12 | Campañas: envíos, entregas conocidas, respuestas, bajas, cupones usados y reservas vinculadas | Hechos y atribución separados; lectura depende de evidencia del canal |
| MET-13 | Automatizaciones: ejecuciones, supresiones, fallos, reintentos y resultados vinculados por regla | Observado; ahorro de tiempo solo como estimación si existe método acordado |
| MET-14 | Rendimiento general: vista por tenant y sucursal de indicadores anteriores y pendientes humanos | Agregado observado; respeta permisos y no implica comparación entre negocios |
| MET-15 | Reservas por origen: WhatsApp, teléfono, presencial u otro manual identificado; desconocido en categoría explícita | Observado; total central y desglose, sin convertir contacto posterior en origen ni atribución a IA |
| MET-16 | Valoraciones reservadas o directas, realizadas, propuestas emitidas/aceptadas y reservas posteriores vinculadas | Observado por etapas; definición de conversión, período y tratamiento de varias propuestas por acordar; no equiparar valoración y tratamiento |
| MET-17 | Información monetaria por etapa: orientativo, confirmado, cobrado, devuelto y diferencia respecto del confirmado; cobro de valoración y aplicación al servicio diferenciados | Hechos y estimaciones identificados; no sumar rangos como ingreso, no duplicar cobro aplicado y señalar total sin definir |

Ingresos asociados a una reserva atendida por IA no se atribuyen íntegramente a la IA. Si se publica una estimación, debe incluir método, entradas y limitaciones; no se inventarán valores para completar reportes. El PRD no fija tasas de conversión, crecimiento, ahorro, retorno ni metas de facturación.

MET-05 a MET-14 abarcan todos los canales cuando corresponda. MET-01 a MET-04 mantienen su unidad conversacional o de intervención de IA; no se fabrican conversaciones para incluir reservas manuales en esos denominadores. Los reportes de reservas generales se contrastan con MET-15. Para MET-08, los importes orientativos comunicados, precios confirmados por personal y pagos verificados constituyen series distintas; la diferencia confirmado-cobrado no se interpreta automáticamente como deuda si hay concepto o política pendiente de resolver (OQ-COM-08).

## 17. Exclusiones y futuras expansiones

La V1 excluye expresamente: el SaaS independiente de comercio electrónico A-Commerce; logística de entregas; optimización de rutas de repartidores; inventario físico complejo; ERP contable completo; nómina; administración avanzada de recursos humanos; historias clínicas; diagnósticos médicos; recomendaciones clínicas autónomas; funcionalidades especializadas de centros médicos; integración arbitraria con todos los proveedores del mercado y desarrollo de modelos fundacionales de IA propios.

El catálogo de servicios y los paquetes de sesiones son ofertas y derechos de atención, no inventario físico. Los reportes de dinero y la conciliación básica no constituyen un ERP contable ni implican una integración fiscal aprobada.

**Futuro, sin compromiso:** automatización de otros canales digitales adicionales a WhatsApp, agentes telefónicos con IA, integraciones adicionales seleccionadas y analítica avanzada con métodos validados. El registro manual de reservas telefónicas y presenciales ya pertenece a V1 y no se clasifica como expansión futura. Su evaluación no condiciona la V1. A-Commerce es una iniciativa independiente que, si se retoma, requiere su propia definición; no es un módulo futuro implícito de esta plataforma.

## 18. Riesgos y supuestos de producto

| Riesgo o supuesto | Implicación y tratamiento funcional | Referencia |
| --- | --- | --- |
| Necesidades y disposición de pago del segmento aún no validadas | Revisar PRD con negocios; no dar por demostrados ingresos ni adecuación comercial | OQ-PRO-01, OQ-BIZ-01 |
| Alcance amplio para equipo pequeño | Desarrollo incremental con recorridos integrados y criterios verificables; no eliminar módulos comprometidos por asumir un presupuesto | Secciones 7 y 19 |
| Canal externo y costos variables | Gestionar elegibilidad, fallos, estados, límites y cambios de políticas sin asumir gratuidad | OQ-INT-01, OQ-BIZ-02 |
| Error o respuesta inventada de IA | Fuente autorizada, validación determinista y derivación humana | FR-MOD01-002 y 005 |
| Conflictos de agenda, pagos tardíos y eventos repetidos | Invariantes de capacidad y dinero, revisión humana y conciliación | FL-12, FL-13; RN-01 a 03 |
| Reglas de beneficios demasiado ambiguas | No activar un programa sin condiciones de acumulación, consumo, reversión y vencimiento | OQ-LOY-01 a 03 |
| Tratamiento inadecuado de datos personales | Minimización, finalidad, acceso y revisión normativa antes de activar tratamiento correspondiente | OQ-SEC-01 a 03 |
| Poco personal para atender escalaciones | Pendientes visibles y política de atención; sin promesa de humano inmediato | OQ-EXP-01 |
| Reportes interpretados como causalidad | Definiciones y separación de hechos, atribución y estimación | MET-03, MET-04, MET-08 |
| Facturación fiscal, impuestos y proveedor no decididos | Definir qué información monetaria y comprobantes requiere la operación sin inventar solución fiscal | OQ-COM-03, OQ-INT-03 |

**Supuestos adicionales propuestos, no decisiones aprobadas:** tenant como frontera de negocio con sucursales; perfil de cliente local a cada tenant; vocabulario preliminar de estados; conservación de condiciones aceptadas y correcciones trazables. Se introducen para hacer verificables recorridos y se revisarán con OQ-PRO-02, OQ-PRO-03, OQ-AGE-03, OQ-COM-01 y OQ-COM-02. No se supone proveedor, stack, valor de retención, intervalo de mantenimiento, política de devolución, modalidad de membresía ni umbral de inactividad.

Los planes de USD 29, USD 59 y USD 99 mensuales son hipótesis comerciales mencionadas, no precios aprobados ni límites de diseño. No existe presupuesto máximo fijado; USD 5.000 no es una restricción del proyecto.

**Riesgos de esta revisión:** baja familiaridad del personal con herramientas, preferencia por teléfono o visita, confusión entre estimación y promesa, modificación de precios sin evidencia y doble conteo de valoración aplicada al servicio. Se tratan mediante registro manual sencillo, agenda independiente del canal, comunicación explícita de modalidad, versiones y aceptación de cotización, y conciliación por concepto. Las cuatro modalidades de precio y la operación multicanal son requisitos confirmados de esta actualización, no hipótesis. Continúan sin decidir obligatoriedad de valoración, su cobro y eventual descuento, facultades de precio, aceptación previa al inicio, políticas de anticipo y resolución de diferencias. El registro del resultado de valoración sigue limitado a información comercial no médica.

## 19. Criterios generales de aceptación de la V1

La aceptación del producto implementado se evaluará posteriormente, no se declara lograda por la existencia de este documento.

1. Los doce módulos están operativos y los 71 requisitos funcionales se verifican, incluidos casos negativos, permisos y dependencias; ningún módulo se omite por llamarlo expansión futura.
2. Los diecinueve flujos pueden recorrerse con datos representativos y dejan estados y evidencias coherentes. Los casos de fallo no se sustituyen por demostraciones solo del camino ideal.
3. La IA solo informa resultados críticos confirmados por el sistema; recomendaciones y operaciones están diferenciadas; el humano puede tomar y devolver control.
4. Se verifica aislamiento entre negocios en consultas, operaciones, contexto de IA, archivos y reportes; soporte no implica acceso indiscriminado.
5. Concurrencia, eventos repetidos y fallos parciales no provocan sobreventa, doble cobro, doble devolución, doble redención ni saldos inconsistentes.
6. Catálogo, agenda, pagos, CRM, automatizaciones, campañas y beneficios operan como recorrido integrado, con condiciones aceptadas e historial de cambios.
7. Consentimiento, bajas, políticas vigentes del canal y condiciones aplicables de protección de datos están validados antes de habilitar comunicaciones; frecuencia y pausa humana se respetan.
8. Reportes muestran definiciones, filtros, cobertura y diferenciación entre observación, atribución y estimación; no presentan promesas de ingresos por IA.
9. Las políticas y medidas pendientes necesarias para una función se resuelven y registran antes de activarla. No se implementan valores arbitrarios para simular que quedaron decididas. Los RNF se evalúan con medidas y condiciones acordadas.
10. Se verifica contingencia y recuperación de operaciones críticas, observabilidad sin exposición de secretos y estado de conexiones. Se realiza revisión funcional por el desarrollador y validación con representantes del segmento antes de aceptar el lanzamiento.

11. Con WhatsApp sin configurar y, por separado, con IA/WhatsApp indisponibles, personal autorizado busca o crea cliente y registra, consulta, cambia y cancela reservas telefónicas y presenciales desde el panel. Estas reservas compiten por la misma disponibilidad que las digitales; origen, usuario registrador y contacto posterior se distinguen. CRM, pagos, fidelización y reportes conservan cobertura independiente del canal.
12. Se valida el recorrido manual con empleados de poca familiaridad tecnológica según condiciones acordadas; no exige transcribir conversaciones digitales ni consentimiento promocional. Preferencias, falta de contacto y permisos determinan supresión o envío de avisos y no bloquean la reserva manual válida.
13. Se prueban las cuatro modalidades por servicio: fijo, desde, rango y sujeto a valoración. IA, panel y automatizaciones distinguen orientación y confirmación; un rango solo se presenta como garantizado si existe compromiso explícito. Total desconocido no aparece como cero ni ingreso.
14. Se registra valoración gratuita y pagada, tanto con cita como directamente en el local; ambas pueden vincularse a cotización y reserva posterior sin crear atención o reserva ficticia. El resultado sigue siendo no médico. Rechazo o falta de aceptación no se presenta como conversión lograda.
15. Revisiones de precio antes y después de aceptación conservan versiones y decisiones; confirmar cotización no significa aceptarla o cobrarla. Se verifican anticipos con total aún desconocido, pagos parciales, cancelaciones, diferencias y eventual aplicación de cobro de valoración sin duplicar ingreso ni imponer porcentaje universal. Facultades y políticas necesarias se resuelven antes de activar sus operaciones.

La documentación M0.1 se acepta para revisión si contiene estructura completa, cobertura de módulos, requisitos comprobables, diecinueve flujos y registro separado de decisiones, sin código, infraestructura ni selección tecnológica. La aprobación del desarrollador sigue pendiente.

## 20. Glosario

| Término | Significado en este PRD |
| --- | --- |
| Establecimiento o negocio | Organización cliente del SaaS; puede operar en varias ubicaciones según definición comercial pendiente |
| Tenant | Frontera funcional de aislamiento de información, configuración y operaciones |
| Sucursal | Ubicación operativa asociada al negocio; no se equipara automáticamente a tenant |
| Cliente final | Persona que consulta o utiliza servicios del negocio; diferente del negocio que paga el SaaS |
| Interesado u oportunidad | Contacto con intención comercial, aún sin reserva vinculada según criterio definido |
| Reserva y cita | Misma entidad funcional de atención planificada; «reserva» destaca la acción comercial y «cita» su operación |
| Solicitud de reserva | Petición registrada que todavía no garantiza capacidad |
| Retención temporal | Compromiso de capacidad sujeto a vencimiento y condiciones, distinto de una cita confirmada |
| Anticipo | Pago parcial requerido u ofrecido antes del servicio; no es un cobro adicional al importe acordado |
| Saldo pendiente | Importe por cubrir según movimientos y condiciones verificadas |
| Recurso compartido | Capacidad necesaria para atender, como cabina o equipo, además del profesional |
| Preparación | Tiempo configurado que debe considerarse alrededor de un servicio para calcular capacidad |
| Poscita | Seguimiento posterior a una atención completada |
| Paquete | Derecho prepagado a sesiones elegibles con saldo y condiciones |
| Membresía | Relación de vigencia periódica y beneficios recurrentes; no presupone cobro automático |
| Redención | Uso validado de un beneficio o cupón |
| Baja promocional | Preferencia que impide nuevos despachos promocionales dentro de su alcance |
| Evento verificable | Hecho registrado o evidencia externa validada que puede activar una regla |
| Deduplicación | Reconocer reintentos o eventos repetidos para evitar efectos múltiples de una misma operación |
| Conciliación básica | Comparar registros de dinero con evidencia del medio de pago y gestionar diferencias |
| Observación | Hecho registrado con evidencia y alcance conocidos |
| Atribución | Asociación de un resultado con una intervención bajo un criterio y ventana explícitos |
| Estimación | Resultado calculado con supuestos y método declarados, distinto de un hecho directamente observado |
| V1 comercial | Lanzamiento comprometido con los doce módulos integrados, sin todas las variantes imaginables |
| Canal de origen | Medio por el que se solicitó la reserva: WhatsApp, teléfono, presencial u otro identificado; diferente del usuario que registra y del canal de avisos posteriores |
| Operación multicanal | Registro central de reservas de distintos orígenes, con las mismas validaciones y continuidad de CRM, pagos, beneficios y reportes |
| Precio desde | Mínimo orientativo configurado que no representa necesariamente el importe final |
| Rango de precios | Estimación entre mínimo y máximo; no garantía de permanencia dentro del rango salvo compromiso explícito |
| Precio sujeto a valoración | Modalidad sin importe definitivo hasta evaluación presencial por el establecimiento |
| Valoración presencial | Evaluación comercial no médica, gratuita o pagada, con resultado y posible oferta posterior; no es diagnóstico ni historia clínica |
| Cotización | Propuesta identificable del establecimiento con precio confirmado, condiciones y versión; emitirla no prueba aceptación ni cobro |
| Precio confirmado | Importe establecido por personal autorizado, diferente del importe orientativo, de la aceptación del cliente y del dinero recibido |
| Importe efectivamente cobrado | Dinero recibido con evidencia verificable para un concepto; puede diferir del precio confirmado por pagos parciales u otras diferencias trazables |

