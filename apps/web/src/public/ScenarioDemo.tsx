import { useEffect, useRef, useState } from "react";
import { DEMO_SCENARIOS, type DemoSector } from "./demo-scenarios";
import { Nomi, type NomiMood } from "./Nomi";
const moods: NomiMood[] = ["welcome", "listening", "thinking", "celebrate"];
export default function ScenarioDemo() {
  const [sector, setSector] = useState<DemoSector>(
      () =>
        DEMO_SCENARIOS.find((item) => `#${item.id}` === window.location.hash)
          ?.id ?? "beauty",
    ),
    [step, setStep] = useState(0),
    [slot, setSlot] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const scenario = DEMO_SCENARIOS.find((item) => item.id === sector)!;
  useEffect(() => {
    if (step > 0) heading.current?.focus();
  }, [step]);
  return (
    <section
      className="noma-demo"
      aria-label="Demostración conceptual interactiva"
    >
      <div className="noma-demo-warning">
        <span aria-hidden="true">◌</span>
        <p>
          <strong>Simulación ilustrativa.</strong> Datos y horarios ficticios.
          Funcionalidad en desarrollo; no utiliza IA ni WhatsApp y no crea
          reservas.
        </p>
      </div>
      <fieldset className="noma-sector-picker">
        <legend>Elige un tipo de negocio para el ejemplo</legend>
        <div>
          {DEMO_SCENARIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={sector === item.id}
              onClick={() => {
                setSector(item.id);
                setStep(0);
                setSlot(null);
              }}
            >
              {item.short}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="noma-demo-body">
        <div className="noma-demo-guide">
          <Nomi mood={moods[step]} />
          <p>
            Nomi acompaña la explicación.
            <br />
            Es un personaje, no un asistente conectado.
          </p>
          <ol aria-label="Pasos de la simulación">
            {[
              "Una conversación",
              "El contexto",
              "Una alternativa",
              "El resultado",
            ].map((label, index) => (
              <li
                key={label}
                aria-current={step === index ? "step" : undefined}
              >
                <span>{`0${index + 1}`}</span>
                {label}
              </li>
            ))}
          </ol>
        </div>
        <div className="noma-demo-panel">
          <p className="noma-kicker" role="status">
            PASO {step + 1} DE 4 · {scenario.label}
          </p>
          <h2 ref={heading} tabIndex={-1}>
            {
              [
                "Todo empieza con una pregunta.",
                "Entender antes de proponer.",
                "Elegir con contexto.",
                "Así se vería el resultado.",
              ][step]
            }
          </h2>
          {step === 0 ? (
            <>
              <p className="noma-demo-person">Persona de ejemplo</p>
              <blockquote>{scenario.message}</blockquote>
              <p>
                Un mensaje predefinido para explicar el recorrido. No se envía a
                ningún servicio.
              </p>
              <button className="noma-button" onClick={() => setStep(1)}>
                Interpretar mensaje (simulación)
                <span aria-hidden="true">→</span>
              </button>
            </>
          ) : step === 1 ? (
            <>
              <dl className="noma-demo-context">
                <div>
                  <dt>Intención ilustrativa</dt>
                  <dd>Consultar una reserva</dd>
                </div>
                <div>
                  <dt>Servicio de ejemplo</dt>
                  <dd>{scenario.service}</dd>
                </div>
                <div>
                  <dt>Antes de ofrecer un horario</dt>
                  <dd>{scenario.check}</dd>
                </div>
              </dl>
              <p>
                Este resumen está escrito para la demo. No es una interpretación
                realizada por un modelo.
              </p>
              <button className="noma-button" onClick={() => setStep(2)}>
                Ver alternativas ficticias<span aria-hidden="true">→</span>
              </button>
            </>
          ) : step === 2 ? (
            <>
              <p>
                Estos horarios explican una elección.{" "}
                <strong>No representan disponibilidad real.</strong>
              </p>
              <fieldset className="noma-demo-slots">
                <legend>Elige una alternativa de ejemplo</legend>
                {["10:00", "16:00"].map((time) => (
                  <label key={time}>
                    <input
                      type="radio"
                      name="illustrative-slot"
                      value={time}
                      checked={slot === time}
                      onChange={() => setSlot(time)}
                    />
                    <span>
                      Día de ejemplo<strong>{time}</strong>
                    </span>
                    <small>Horario ficticio</small>
                  </label>
                ))}
              </fieldset>
              <button
                className="noma-button"
                disabled={!slot}
                onClick={() => setStep(3)}
              >
                Ver resultado ilustrativo<span aria-hidden="true">→</span>
              </button>
            </>
          ) : (
            <>
              <div className="noma-demo-result">
                <span aria-hidden="true">✓</span>
                <p>Solicitud de ejemplo</p>
                <h3>{scenario.service}</h3>
                <p>Día ficticio · {slot}</p>
                <strong>No se creó ninguna reserva.</strong>
              </div>
              <p>
                En el producto futuro, confirmar requerirá disponibilidad real y
                reglas del establecimiento. Ese motor todavía está en
                desarrollo.
              </p>
              <button
                className="noma-button"
                onClick={() => {
                  setStep(0);
                  setSlot(null);
                }}
              >
                Repetir recorrido<span aria-hidden="true">↻</span>
              </button>
            </>
          )}
          {step > 0 && (
            <button
              className="noma-demo-back"
              onClick={() => setStep(step - 1)}
            >
              Volver un paso
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
