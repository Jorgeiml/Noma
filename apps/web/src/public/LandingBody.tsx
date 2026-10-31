import { useEffect, useRef, useState } from "react";
import {
  DEMO_SCENARIOS,
  sectorWhatsAppUrl,
  type DemoSector,
} from "./demo-scenarios";
import { Pricing } from "./Pricing";
import { ProductFilm } from "./ProductFilm";
import "./explorer.css";
const chapters = [
  ["recorrido", "En 1 minuto"],
  ["sectores", "Tu sector"],
  ["planes", "Precios"],
  ["estado", "Confianza"],
  ["preguntas", "Preguntas"],
] as const;
type Chapter = (typeof chapters)[number][0];
function currentChapter(): Chapter {
  const hash = window.location.hash.slice(1);
  return chapters.find(([id]) => id === hash)?.[0] ?? "recorrido";
}
export default function LandingBody() {
  const [chapter, setChapter] = useState<Chapter>(currentChapter);
  const [sector, setSector] = useState<DemoSector>("beauty");
  const panel = useRef<HTMLElement>(null);
  const selected = DEMO_SCENARIOS.find((item) => item.id === sector)!;
  const whatsapp = sectorWhatsAppUrl(import.meta.env.VITE_PUBLIC_CONTACT_URL);
  useEffect(() => {
    let frame = 0;
    const followHash = () => {
      if (!chapters.some(([id]) => `#${id}` === window.location.hash)) return;
      setChapter(currentChapter());
      frame = window.requestAnimationFrame(() =>
        panel.current?.scrollIntoView?.({ block: "start" }),
      );
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => {
      window.removeEventListener("hashchange", followHash);
      window.cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <>
      <section className="noma-partners" aria-labelledby="noma-partners-title">
        <div>
          <h2 id="noma-partners-title">¿Con quiénes trabajamos?</h2>
          <p>El próximo logo podría ser el tuyo.</p>
        </div>
        <ul aria-label="Muestra de futuras marcas">
          <li className="noma-logo-ritmo">
            ritmo<span>BARBER STUDIO</span>
          </li>
          <li className="noma-logo-cima">
            CIMA<span>MOVEMENT CLUB</span>
          </li>
          <li className="noma-logo-marea">
            marea<span>ESTUDIO DENTAL</span>
          </li>
          <li className="noma-logo-eje">
            EJE<span>MOTOR HOUSE</span>
          </li>
        </ul>
        <small>
          Vista de ejemplo · marcas ficticias, sin relación comercial con Noma.
        </small>
      </section>
      <section
        className="noma-explorer"
        ref={panel}
        aria-label="Explorar Noma a tu ritmo"
      >
        <div className="noma-explorer-bar">
          <p className="noma-kicker">TÚ ELIGES EL RECORRIDO</p>
          <nav aria-label="Secciones de Noma">
            {chapters.map(([id, label], index) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={chapter === id ? "location" : undefined}
              >
                <span aria-hidden="true">0{index + 1}</span>
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div key={chapter} id={chapter} className="noma-chapter">
          {chapter === "recorrido" && <ProductFilm />}
          {chapter === "sectores" && (
            <section
              className="noma-industries"
              aria-labelledby="noma-sector-title"
            >
              <div className="noma-section-heading">
                <p className="noma-kicker">
                  CUATRO OFICIOS. LA MISMA ATENCIÓN.
                </p>
                <h2 id="noma-sector-title">
                  Tu negocio tiene su propio ritmo.
                </h2>
              </div>
              <div className="noma-industry-layout">
                <div
                  className="noma-industry-list"
                  role="group"
                  aria-label="Explorar las cuatro verticales"
                >
                  {DEMO_SCENARIOS.map((item) => (
                    <button
                      key={item.id}
                      aria-pressed={sector === item.id}
                      onClick={() => setSector(item.id)}
                    >
                      <span>{item.number}</span>
                      <strong>{item.label}</strong>
                      <span aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
                <div className="noma-industry-context" aria-live="polite">
                  <div className="noma-industry-label">
                    <span>{selected.status}</span>
                    <span>{selected.number} / 04</span>
                  </div>
                  <h3>{selected.label}</h3>
                  <p>{selected.context}</p>
                  <p className="noma-industry-terms">{selected.terms}</p>
                  <a href={`/demo#${selected.id}`} className="noma-text-link">
                    Ver un ejemplo ilustrativo<span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
              <p className="noma-industry-disclaimer">
                Beauty → Dental → Fitness → Automotive. Lanzamiento comercial
                conjunto cuando las cuatro verticales estén preparadas y
                validadas.
              </p>
              {whatsapp && (
                <aside
                  className="noma-sector-contact"
                  aria-labelledby="noma-sector-contact-title"
                >
                  <div>
                    <h3 id="noma-sector-contact-title">
                      ¿Tu giro de negocio no se encuentra aquí?
                    </h3>
                    <p>
                      Cuéntanos a qué te dedicas. Nos encantará conocer tu
                      negocio.
                    </p>
                  </div>
                  <a
                    className="noma-button"
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="noma-whatsapp-icon"
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="currentColor"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.42 0 .04 5.38.04 12c0 2.12.55 4.19 1.6 6.02L0 24l6.12-1.6A11.97 11.97 0 0 0 12.04 24C18.66 24 24 18.62 24 12c0-3.2-1.24-6.22-3.48-8.52ZM12.04 22a9.96 9.96 0 0 1-5.08-1.39l-.36-.21-3.63.95.97-3.54-.23-.37A9.93 9.93 0 0 1 2.04 12C2.04 6.49 6.53 2 12.04 2S22 6.49 22 12s-4.45 10-9.96 10Zm5.48-7.48c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5 0 1.48 1.08 2.9 1.23 3.1.15.2 2.12 3.24 5.13 4.55.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z" />
                    </svg>
                    Escríbenos por WhatsApp<span aria-hidden="true">↗</span>
                  </a>
                </aside>
              )}
            </section>
          )}
          {chapter === "planes" && <Pricing />}
          {chapter === "estado" && (
            <section className="noma-trust" aria-labelledby="noma-trust-title">
              <div>
                <p className="noma-kicker">
                  LA CONFIANZA SE CONSTRUYE CON CLARIDAD
                </p>
                <h2 id="noma-trust-title">
                  Lo que ves.
                  <br />
                  Lo que hay.
                </h2>
                <p>
                  Sin clientes inventados, resultados prometidos ni funciones
                  futuras disfrazadas de presentes.
                </p>
                <a href="/demo" className="noma-text-link">
                  Conocer la demo<span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className="noma-trust-facts">
                <article>
                  <span>01 / HOY</span>
                  <h3>Una base operativa real.</h3>
                  <p>
                    En Beauty, desarrollo local: establecimiento, catálogo,
                    precios flexibles, equipo, sucursales, horarios y recursos.
                    Aún no calcula disponibilidad ni crea citas.
                  </p>
                </article>
                <article>
                  <span>02 / EN DESARROLLO</span>
                  <h3>El siguiente paso, a la vista.</h3>
                  <p>
                    Reservas, recepción con IA, WhatsApp, pagos y las otras
                    verticales siguen pendientes. No se cobran como funciones
                    entregadas.
                  </p>
                </article>
                <article>
                  <span>03 / CONTROL HUMANO</span>
                  <h3>Tu operación tiene reglas.</h3>
                  <p>
                    El acceso local valida membresías y permisos del
                    establecimiento. La futura IA deberá respetar esas reglas y
                    la supervisión humana; puede cometer errores.
                  </p>
                </article>
              </div>
            </section>
          )}
          {chapter === "preguntas" && (
            <section className="noma-faq" aria-labelledby="noma-faq-title">
              <div>
                <p className="noma-kicker">RESPUESTAS CORTAS, POR FAVOR</p>
                <h2 id="noma-faq-title">Hablemos claro.</h2>
                <p>Abre solo lo que te interesa.</p>
              </div>
              <div>
                {[
                  [
                    "¿Ya puedo contratar Noma?",
                    "Todavía no. Los planes son una propuesta comercial, no precios económicamente validados ni una oferta de funciones disponibles. La apertura será cuando las cuatro verticales estén preparadas y validadas.",
                  ],
                  [
                    "¿La demo crea una cita?",
                    "No. Usa datos ficticios. No consulta disponibilidad, envía WhatsApp, utiliza IA ni modifica ningún establecimiento.",
                  ],
                  [
                    "¿Qué es una sesión IA?",
                    "La propuesta cuenta la atención automatizada de un cliente durante 24 horas desde su inicio, aunque intercambie varios mensajes. No equivale a una cita, un mensaje de Meta ni una sesión de entrenamiento. Los límites de uso razonable se publicarán antes del cobro.",
                  ],
                  [
                    "¿Hay cargos externos?",
                    "Sí, cuando se habiliten esas integraciones: Meta o su proveedor facturan mensajería y la pasarela cobra por procesar pagos. Son cargos separados de la suscripción y las sesiones IA. Se informarán antes de contratar; no hay proveedores definitivos seleccionados.",
                  ],
                  [
                    "¿Cómo entro si ya tengo acceso?",
                    "Acceder abre la identidad comercial. El acceso local con código se mantiene separado para desarrollo. Registrar una identidad no activa una suscripción ni crea un establecimiento.",
                  ],
                ].map(([question, answer]) => (
                  <details key={question}>
                    <summary>
                      {question}
                      <span aria-hidden="true">+</span>
                    </summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </>
  );
}
