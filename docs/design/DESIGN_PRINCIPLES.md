# Principios permanentes de diseño UI/UX

## Alcance y estado

Directriz del desarrollador para todas las interfaces futuras del SaaS de belleza,
estética y bienestar en Ecuador. Orienta el diseño; no selecciona una marca, paleta,
tipografía, navegación ni biblioteca definitiva. La dirección visual se someterá a
aprobación al diseñar la primera experiencia funcional.

Este documento no modifica M1.1 ni autoriza nuevos módulos, pantallas ficticias,
dependencias o avances de milestone.

## Principios

- Construir una identidad propia, moderna, profesional y funcional, sin copiar
  layouts de otras plataformas ni adoptar la apariencia de una plantilla administrativa.
- Diseñar un espacio de trabajo por tareas y objetivos: acciones rápidas, información
  contextual, jerarquía clara y baja carga cognitiva.
- Favorecer una composición editorial deliberada; usar asimetría solo cuando ayude
  a comprender o realizar la tarea. La facilidad de uso prevalece sobre la novedad visual.
- Mantener consistencia funcional sin obligar a todas las experiencias a compartir
  la misma composición, tabla, formulario o conjunto de tarjetas.
- Diseñar para propietarios, recepcionistas, profesionales y administradores,
  incluyendo personas con poca familiaridad tecnológica.
- Permitir operación cotidiana y reservas manuales rápidas para atención telefónica
  o presencial, sin depender de WhatsApp ni IA configurados.
- Hacer las funciones visibles y descubribles: ningún flujo esencial debe exigir
  memorizar comandos o conocer atajos.

## Restricciones y decisiones que requieren justificación

No adoptar automáticamente sidebar permanente con muchos módulos, encabezado con
cuadrícula de KPI, layouts repetitivos, plantillas genéricas ni el aspecto típico
de dashboards generados por IA. Evitar gradientes sin propósito, morado o azul por
defecto, exceso de tarjetas, sombras, bordes y redondeados, iconos decorativos y
animaciones innecesarias. Una excepción debe resolver un problema concreto y
explicarse mediante un escenario de uso y sus alternativas.

Evaluar navegación contextual, áreas superiores, navegación compacta por tareas,
paleta de comandos, acciones contextuales, detalles bajo demanda y adaptación por
rol o dispositivo. Ninguna alternativa queda seleccionada aquí. Compararlas por
aprendizaje, orientación, accesibilidad, velocidad y crecimiento a los doce módulos
del PRD; conservar rutas visibles para quienes no usen comandos.

Explorar composiciones adecuadas a inicio del día, agenda y profesionales, reserva
rápida, conversaciones y atención humana, clientes, valoraciones y cotizaciones,
cobros y anticipos, marketing, fidelización y analítica de propietarios. Esta lista
orienta experiencias futuras; no constituye una autorización para implementarlas.

## Base de diseño antes de interfaces empresariales complejas

Definir dirección visual, tipografía y jerarquía, espaciado, colores semánticos y
contraste, estados de interacción, comportamiento responsivo y componentes esenciales.
Incluir accesibilidad, transiciones con propósito y estados de carga, error y ausencia
de datos. No instalar una biblioteca UI completa por defecto; pueden evaluarse
primitivas accesibles conservando la identidad propia.

## Proceso y criterios de evaluación

Para cada interfaz importante:

1. Identificar usuario, tarea, contexto y restricciones con un escenario concreto.
2. Proponer al menos dos disposiciones distintas cuando haya una decisión relevante.
3. Comparar ventajas y riesgos; seleccionar una propuesta con razones observables.
4. Implementar componentes y flujos reales dentro del milestone autorizado.
5. Probar teclado, mouse, tacto, foco, semántica, contraste y distintas resoluciones.
6. Verificar la tarea completa, incluidos carga, ausencia de datos, errores y recuperación.
7. Ajustar según observaciones reales, distinguiendo hipótesis de resultados comprobados.

Cada propuesta debe responder con escenarios, pasos y evidencia, sin afirmaciones vagas:

| Pregunta | Criterio de evaluación |
| --- | --- |
| ¿Quién usa la pantalla? | Identificar rol, experiencia tecnológica y contexto de atención. |
| ¿Qué necesita hacer? | Describir la tarea y cómo reconocer que la completó. |
| ¿Cuál es la acción principal? | Mostrar una prioridad clara y una forma visible de iniciarla. |
| ¿Qué información necesita realmente? | Vincular cada dato inicial a una decisión o acción. |
| ¿Qué puede ocultarse al inicio? | Mostrar cómo se descubre el detalle sin perder orientación. |
| ¿Cuántos pasos requiere? | Enumerar el recorrido y evaluar fricción en tareas frecuentes. |
| ¿Qué ocurre ante un error? | Explicar mensaje, conservación de datos y recuperación. |
| ¿Cómo funciona con teclado, mouse y tacto? | Verificar recorrido, foco y controles utilizables con cada modalidad. |
| ¿Cómo se adapta a resoluciones distintas? | Comprobar prioridades, lectura y acciones sin perder funciones esenciales. |
| ¿Qué mejora frente a un dashboard tradicional? | Comparar el mismo escenario por orientación, pasos, errores o carga cognitiva; una apariencia diferente no basta. |

Escenario prioritario para evaluar propuestas futuras: una recepcionista recibe una
llamada y registra una reserva manual sin WhatsApp ni IA. Documentar cómo encuentra
la acción, el recorrido, los datos imprescindibles, la recuperación de errores y el
resultado en móvil y escritorio. Los detalles de negocio se tomarán del PRD y de las
preguntas resueltas, sin inventar reglas.

## Preguntas de diseño pendientes

- ¿Qué rol, tarea y dispositivo definirán la primera experiencia funcional?
- ¿Qué pasos y dificultades se observan hoy al registrar reservas por teléfono o en persona?
- ¿Qué dos disposiciones facilitan mejor esa tarea y permiten orientarse entre áreas?
- ¿Qué acciones e información deben permanecer visibles por rol y resolución?
- ¿Qué dirección visual, tipografía, paleta y densidad reflejan una identidad propia
  y permiten operar con claridad durante toda la jornada?
- ¿Qué componentes y primitivas accesibles hacen falta para esa primera experiencia?
- ¿Con qué usuarios y escenarios se probarán aprendizaje, rapidez, errores y accesibilidad?
- ¿Qué evidencia y ajustes se presentarán para aprobar la dirección visual definitiva?

Estas preguntas quedan abiertas para el diseño de la primera experiencia funcional.
No se fijan umbrales ni decisiones definitivas sin contexto y validación.
