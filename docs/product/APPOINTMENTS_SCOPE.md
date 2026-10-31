# Appointments — alcance multisectorial (M1.6.1)

Decisión del desarrollador, 29 de octubre de 2026. La plataforma central tendrá
productos especializados; Appointments es el primero, orientado a negocios de
servicios. Esta decisión amplía el supuesto de mercado exclusivo de belleza del
PRD original. El PRD, OPEN_QUESTIONS y las decisiones históricas se conservan sin
reescribirlos. No implica implementar ahora otros productos ni nuevas funciones.

## Desarrollo y lanzamiento

Orden obligatorio: **BEAUTY → DENTAL → FITNESS → AUTOMOTIVE**. Son exactamente las
cuatro verticales iniciales. El lanzamiento comercial general requiere que las
cuatro estén preparadas y validadas. Ninguna se anuncia comercialmente disponible.
Solo BEAUTY tiene operación ejecutable de desarrollo en este milestone.

## Modelo y administración

`Establishment.vertical` usa el enum PostgreSQL/Prisma `BusinessVertical`. Un enum
es suficiente para cuatro códigos controlados; añadir otro requerirá una migración
explícita. No hay tablas por sector, plugins, reglas dinámicas ni entidades
Barber/Dentist/Mechanic. Se reutilizan ServiceOffering, Professional, Branch,
PhysicalResource, WorkSchedule y sus asociaciones.

La migración `20261029000100_appointments_verticals` es aditiva y transaccional:
campo nullable, sin default ni backfill inferido. Las filas de origen desconocido
quedan UNCLASSIFIED. Conservan identidad, sesión y configuración general, pero
sus operaciones requieren clasificación administrada antes de habilitarse.

La clasificación inicial se realiza por CLI local con UUID, versión y evidencia
explícitos. Registra fecha y motivo e incrementa la versión para invalidar ediciones
obsoletas. No reclasifica establecimientos ya configurados. No existe endpoint ni
selector editable para cambiar de sector. La CLI exige desarrollo local y la base
`beauty_wellness_dev` con usuario `bw_local`; no funciona en producción. El alta
local requiere `--vertical BEAUTY`; las otras verticales se reconocen, pero se
rechazan con explicación antes de crear datos. Una futura reclasificación necesita
otro procedimiento autorizado y validación de compatibilidad; no se improvisa aquí.

## Contrato y controles

El registro único está en `apps/api/src/sector/sector.contract.ts`: códigos, orden,
terminología y estados IMPLEMENTED / PLANNED / UNAVAILABLE. React importa solo sus
tipos y recibe los valores desde el backend, en el establecimiento autorizado y en
`GET /api/platform/sector-configuration`. No se duplica el registro en localStorage.

LocalOwnerGuard mantiene cookies, origen, loopback, expiración, consumo único,
revocación y aislamiento. Después, SectorCapabilityGuard exige capacidades
implementadas en Offering y Staff. La vertical se consulta de PostgreSQL en cada
sesión autorizada; un parámetro del cliente no puede sustituirla. Estos guards
complementan las verificaciones de tenant existentes, sin reemplazarlas.

## Terminología contextual

| Vertical | Equipo | Oferta | Recursos | Reserva futura / evaluación |
| --- | --- | --- | --- | --- |
| BEAUTY | Profesionales | Servicios | Cabinas, estaciones y sillas | Citas / valoración previa |
| DENTAL | Odontólogos y profesionales | Consultas y procedimientos | Consultorios y sillones | Citas / evaluación |
| FITNESS | Entrenadores e instructores | Clases y sesiones | Salas y estaciones | Reservas / evaluación inicial |
| AUTOMOTIVE | Técnicos | Servicios | Bahías y equipos | Citas y turnos / diagnóstico |

Son términos de presentación, no nuevas entidades. Cupos pertenecen a capacidad
grupal, no se usan como sustituto de una evaluación. No hay reemplazos globales de
palabras; la oferta sigue siendo un servicio, nunca un producto físico.

## Matriz funcional actual

I = IMPLEMENTED (desarrollo ejecutable y probado), P = PLANNED,
U = UNAVAILABLE (no aplica o queda fuera del alcance actual del sector).

| Capacidad | BEAUTY | DENTAL | FITNESS | AUTOMOTIVE |
| --- | --- | --- | --- | --- |
| Catálogo individual y cuatro modalidades de precio | I | P | P | P |
| Profesionales, sucursales y recursos | I | P | P | P |
| Horarios, excepciones y requisitos de recursos | I | P | P | P |
| Configuración de valoración previa del catálogo | I | P | P | P |
| Reservas individuales | P | P | P | P |
| Gestión de valoraciones realizadas | P | P | P | P |
| Reservas grupales, cupos compartidos, paquetes | U | U | P | U |
| Vehículos y diagnósticos programados | U | U | U | P |
| Anticipos, WhatsApp y facturación | P | P | P | P |

La evidencia para I es el CRUD persistido de M1.4–M1.6 y sus regresiones HTTP/
PostgreSQL. La capacidad de valoración implementada es solamente configuración del
catálogo; no registro de evaluaciones, diagnósticos ni atención realizada. Los
horarios no calculan disponibilidad ni reservan capacidad. No hay motor de
reservas en ninguna vertical. Que existan entidades comunes no valida el producto
Dental, Fitness o Automotive: sus operaciones permanecen bloqueadas.

## UI y límites

Se mantiene la identidad visual neutral existente, navegación plegable, personaje
vectorial y movimiento reducido. Solo se añade información de sector y detalles
de terminología/capacidades; no hay pantallas simuladas ni rutas de otros sectores.
La marca visible pasa a Appointments. El nombre de carpeta, paquetes y bases se
conserva para no romper el entorno. No se avanza a M1.7 ni se implementan reservas,
clínica, vehículos, pagos, facturación, IA, WhatsApp u OIDC.
