import { useState } from "react";
import {
  COMMERCIAL_PLANS,
  type PlanId,
} from "../../../api/src/commercial/plan.contract";
import { Nomi } from "./Nomi";
import { PlanCharacter } from "./PlanCharacter";
import { publicContactUrl } from "./demo-scenarios";
import "./explorer.css";

const plans = COMMERCIAL_PLANS;
const comparison = [
  ["Agenda manual y reservas online", "Sí", "Sí", "Sí"],
  ["Comisión Noma por reserva", "$0", "$0", "$0"],
  ["Catálogo y precios flexibles", "Sí", "Sí", "Sí"],
  ["Profesionales, horarios y recursos", "Sí", "Sí", "Sí"],
  ["Clientes e historial administrativo", "Sí", "Sí", "Sí"],
  [
    "Recepción IA por WhatsApp; consultar, crear, reagendar y cancelar citas",
    "Sí",
    "Sí",
    "Sí",
  ],
  ["Bandeja humana, recordatorios y confirmaciones", "Sí", "Sí", "Sí"],
  ["Anticipos y enlaces de pago", "Sí", "Sí", "Sí"],
  ["Informes de reservas y asistencia", "Sí", "Sí", "Sí"],
  ["Seguimiento poscita", "Básico", "Avanzado", "Avanzado"],
  ["Campañas WhatsApp, paquetes, bonos y fidelización", "No", "Sí", "Sí"],
  ["Reactivación y analítica comercial avanzada", "No", "Sí", "Sí"],
  ["Roles y permisos avanzados", "No", "Básicos", "Completos"],
  ["Automatizaciones personalizadas", "No", "Limitadas", "Ampliadas"],
  ["Soporte", "Tickets", "Tickets", "Prioritario"],
  [
    "Servicios, clientes y reservas",
    "Sin límite comercial fijo",
    "Sin límite comercial fijo",
    "Sin límite comercial fijo",
  ],
] as const;
export function Pricing({
  selection,
}: {
  selection?: {
    plan: PlanId;
    disabled: boolean;
    onSelect: (plan: PlanId) => void;
  };
} = {}) {
  const [annual, setAnnual] = useState(false);
  const [mobilePlan, setMobilePlan] = useState("Grow");
  const [showSessions, setShowSessions] = useState(false);
  const contact = publicContactUrl(import.meta.env.VITE_PUBLIC_CONTACT_URL);
  return (
    <section className="noma-pricing" aria-labelledby="noma-pricing-title">
      <div className="noma-pricing-heading">
        <div>
          <p className="noma-kicker">UN PLAN QUE SIGA TU RITMO</p>
          <h2 id="noma-pricing-title">Claro desde el principio.</h2>
          <p>
            Precios propuestos en USD, antes de IVA. Aún no contratables ni
            económicamente validados.
          </p>
        </div>
        <div
          className="noma-billing"
          role="group"
          aria-label="Período de facturación propuesto"
        >
          <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
            Mensual
          </button>
          <button aria-pressed={annual} onClick={() => setAnnual(true)}>
            Anual <span>2 meses de ahorro</span>
          </button>
        </div>
      </div>
      <p className="noma-pricing-status">
        Propuesta para el lanzamiento · Incluye capacidades todavía en
        desarrollo. No hay compra, prueba comercial ni activación de
        suscripciones.
      </p>
      <div
        className="noma-plan-picker"
        role="group"
        aria-label="Plan que quieres consultar"
      >
        {plans.map((plan) => (
          <button
            key={plan.name}
            aria-pressed={mobilePlan === plan.name}
            onClick={() => setMobilePlan(plan.name)}
          >
            {plan.name}
          </button>
        ))}
      </div>
      <div className="noma-plan-grid" aria-live="polite">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="noma-plan"
            data-featured={plan.name === "Grow"}
            data-mobile-selected={mobilePlan === plan.name}
            data-selected={selection?.plan === plan.id}
            aria-labelledby={`plan-${plan.name}`}
          >
            <div className="noma-plan-intro">
              <div>
                <div className="noma-plan-name">
                  <h3 id={`plan-${plan.name}`}>{plan.name}</h3>
                  {plan.name === "Grow" && <span>Plan principal</span>}
                </div>
                <p className="noma-plan-line">{plan.line}</p>
              </div>
              <PlanCharacter scene={plan.scene} />
            </div>
            <p className="noma-plan-price">
              <strong>${annual ? plan.annual : plan.monthly}</strong>
              <span>/{annual ? "año" : "mes"} + IVA</span>
            </p>
            <p className="noma-plan-billing">
              {annual
                ? `Un pago de $${plan.annual} por adelantado. No son 12 cuotas.`
                : "Facturación mensual propuesta, por adelantado."}
            </p>
            <ul>
              <li>
                <strong>{plan.branches}</strong>{" "}
                {plan.branches === 1 ? "sucursal" : "sucursales"}
              </li>
              <li>
                <strong>{plan.people}</strong> profesionales activos
              </li>
              <li>
                <strong>{plan.users}</strong> usuarios del panel
              </li>
              <li>
                <strong>{plan.numbers}</strong>{" "}
                {plan.numbers === 1
                  ? "número de WhatsApp"
                  : "números de WhatsApp"}
              </li>
              <li className="noma-plan-sessions">
                <strong>{plan.sessions}</strong> sesiones IA / mes
                <button
                  className="noma-session-info"
                  aria-label={`¿Qué es una sesión IA? Información para ${plan.name}`}
                  aria-expanded={showSessions}
                  aria-controls="noma-session-explanation"
                  onClick={() => setShowSessions(!showSessions)}
                >
                  <span aria-hidden="true">?</span>
                </button>
              </li>
            </ul>
            {selection && (
              <button
                type="button"
                className="noma-plan-select"
                aria-pressed={selection.plan === plan.id}
                disabled={selection.disabled}
                onClick={() => selection.onSelect(plan.id)}
              >
                {selection.plan === plan.id
                  ? `${plan.name} seleccionado`
                  : `Seleccionar ${plan.name}`}
                <span aria-hidden="true">
                  {selection.plan === plan.id ? "✓" : "↗"}
                </span>
              </button>
            )}
          </article>
        ))}
      </div>
      <button
        className="noma-session-toggle"
        aria-expanded={showSessions}
        aria-controls="noma-session-explanation"
        onClick={() => setShowSessions(!showSessions)}
      >
        <span className="noma-info-symbol" aria-hidden="true">
          ?
        </span>
        ¿Qué es una sesión IA?
        <span aria-hidden="true">{showSessions ? "−" : "+"}</span>
      </button>
      <div
        id="noma-session-explanation"
        className="noma-session-guide"
        hidden={!showSessions}
      >
        <Nomi mood="thinking" />
        <div>
          <h3>Una conversación, no cada mensaje.</h3>
          <p>
            <strong>
              Proponemos contar una sesión IA como la atención automatizada de
              un cliente durante 24 horas desde su inicio.
            </strong>{" "}
            Puede incluir varios mensajes y consultas al sistema. No es una
            cita, un mensaje cobrado por Meta ni una clase de Fitness.
          </p>
          <p>
            Ejemplo: Ana pregunta a las 10:00 y vuelve a las 15:00 del mismo
            día: una sesión. Si retoma después de las 10:00 del día siguiente,
            empezaría otra sesión si la IA vuelve a atenderla.
          </p>
        </div>
      </div>
      <div
        className="noma-price-clarity"
        aria-label="Condiciones esenciales de la propuesta"
      >
        <p>
          <strong>Sin excedentes automáticos.</strong> Avisos al 80 % y 100 %.
          Al agotarse la cuota, no se iniciarían nuevas sesiones IA; la gestión
          manual y la atención humana seguirían disponibles.
        </p>
        <p>
          <strong>Consumos separados.</strong> IVA, mensajería Meta o proveedor
          y comisiones de pasarela no están incluidos. Una sesión IA no equivale
          a un mensaje facturable de WhatsApp.
        </p>
        <p>
          <strong>Cuota mensual, también en anual.</strong> Se renueva cada
          ciclo mensual y no se acumula. Paquetes adicionales y límites de uso
          razonable pendientes de publicar antes del cobro.
        </p>
      </div>
      <div className="noma-price-details">
        <details>
          <summary>
            Comparar todo lo previsto en cada plan
            <span aria-hidden="true">+</span>
          </summary>
          <p>
            Esta tabla describe la propuesta del lanzamiento, no funciones
            disponibles hoy.
          </p>
          <div
            className="noma-comparison-wrap"
            role="region"
            aria-label="Comparación de planes propuestos"
            tabIndex={0}
          >
            <table>
              <caption>
                Capacidades previstas; implementación y validación pendientes.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Capacidad propuesta</th>
                  {plans.map((plan) => (
                    <th key={plan.name} scope="col">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map(([label, ...values]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {values.map((value, index) => (
                      <td key={index}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Capacidades de cada vertical una vez implementadas: por ejemplo,
            clases y cupos en Fitness o fichas administrativas de vehículos en
            Automotive. Sin historias clínicas, diagnósticos, nómina, inventario
            completo ni gestión integral de taller.
          </p>
        </details>
        <details>
          <summary>
            Qué cuenta en los límites y qué tendría costo adicional
            <span aria-hidden="true">+</span>
          </summary>
          <p>
            Los límites son por suscripción. Un profesional activo cuenta aunque
            no entre al panel; un usuario cuenta si tiene acceso habilitado;
            cada ubicación operativa distinta es una sucursal.
          </p>
          <p>
            Instalación estándar y onboarding autoguiado propuestos a $0;
            actualizaciones normales incluidas. Sin comisión Noma por reserva.
            Integraciones especiales, migración asistida, capacitación
            personalizada y facturación electrónica opcional requerirían
            informar o cotizar sus costos. Más capacidad: cambio de plan o
            propuesta individual.
          </p>
          <p>
            WhatsApp requerirá cuenta elegible y aprobaciones de Meta. Tarifas
            variables de Meta y posibles comisiones del proveedor, informadas
            por separado; campañas solo con autorización. Enlaces de pago
            incluidos no significan procesamiento gratuito. No se ha
            seleccionado una pasarela definitiva ni se publican tarifas externas
            como garantizadas.
          </p>
        </details>
        <details>
          <summary>
            Prueba, cancelación y otras condiciones propuestas
            <span aria-hidden="true">+</span>
          </summary>
          <p>
            Para el lanzamiento se propone una prueba de 14 días sin tarjeta,
            con IA limitada y sin WhatsApp real incluido. No está activa hoy. La
            contratación y cualquier renovación necesitarían autorización de
            cobro.
          </p>
          <p>
            Cancelación mensual sin penalización; en anual se desactivaría la
            próxima renovación, con reembolsos explicados antes de comprar.
            Cambios a un plan superior con prorrateo aceptado; a uno inferior,
            al siguiente período y avisando límites excedidos.
          </p>
          <p>
            Se proponen 7 días para regularizar impagos, 30 días para recuperar
            datos tras cancelar y 30 días de aviso para cambios de precio,
            sujetos a revisión legal. Exportación, reembolsos, obligaciones de
            conservación, privacidad y condiciones de soporte deberán publicarse
            antes de contratar.
          </p>
          <p>
            El negocio conserva los derechos que correspondan sobre sus datos.
            La IA puede equivocarse y requiere supervisión humana. No se
            garantizan ventas, reservas, ingresos ni disponibilidad del 100 %.
            No se permiten spam ni mensajes sin autorización. Estas son
            condiciones propuestas, no términos legales aprobados.
          </p>
        </details>
      </div>
      <div className="noma-enterprise">
        <p>
          <strong>¿Algo más grande? Enterprise.</strong> Precio, límites,
          soporte e integraciones mediante cotización individual cuando abra la
          oferta comercial.
        </p>
        <a
          className="noma-text-link"
          href={contact ?? "/demo"}
          {...(contact ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {contact ? "Conversar sobre Noma" : "Mientras tanto, explora la demo"}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
