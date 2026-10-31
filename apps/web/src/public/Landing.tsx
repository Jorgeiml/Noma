import { useState } from "react";
import { Nomi, type NomiMood } from "./Nomi";
import { PublicHeader, PublicFooter } from "./PublicChrome";
import { ProgressiveContent } from "./ProgressiveContent";
import "./public.css";
const moods: NomiMood[] = [
  "welcome",
  "listening",
  "thinking",
  "confirm",
  "celebrate",
  "rest",
];
const moodLabels = [
  "Hola. Soy Nomi.",
  "Te escucho.",
  "Todo tiene su contexto.",
  "Una cosa a la vez.",
  "Así, mucho mejor.",
  "También hay que respirar.",
];
export function Landing() {
  const [mood, setMood] = useState(0);
  return (
    <div className="noma-site">
      <PublicHeader />
      <main id="noma-content">
        <section className="noma-hero" aria-labelledby="noma-title">
          <div className="noma-hero-copy">
            <p className="noma-kicker">
              <span className="noma-development-dot" /> RECEPCIÓN, RESERVAS Y
              OPERACIÓN · EN DESARROLLO
            </p>
            <h1 id="noma-title">
              Que atender bien
              <br />
              no te quite
              <br />
              <span>el día entero.</span>
            </h1>
            <p className="noma-hero-description">
              Estamos construyendo Noma para conectar recepción, reservas y
              operación de negocios de servicios para que cada detalle encuentre
              su lugar.
            </p>
            <div className="noma-hero-actions">
              <a className="noma-button" href="/demo">
                Explorar la demo<span aria-hidden="true">↗</span>
              </a>
              <a className="noma-text-link" href="#estado">
                Qué puedes usar hoy<span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="noma-hero-honesty">
              Hoy: operación inicial de Beauty.
              <br />
              Reservas, recepción con IA y pagos: todavía en desarrollo.
            </p>
          </div>
          <div className="noma-hero-scene">
            <div className="noma-orbit" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="noma-speech">
              <span>UN MENSAJE, MUCHAS POSIBILIDADES</span>
              <p>
                «Hola, ¿tienes un espacio
                <br />
                el viernes?»
              </p>
            </div>
            <button
              className="noma-character-button"
              aria-label="Personaje Nomi: cambiar expresión"
              onClick={() => setMood((mood + 1) % moods.length)}
            >
              <Nomi mood={moods[mood]} />
            </button>
            <div className="noma-gesture-caption">
              <span aria-hidden="true">↖</span>
              <span>
                {moodLabels[mood]}
                <small>Un personaje con distintas expresiones. Tócalo.</small>
              </span>
            </div>
            <div className="noma-illustrative-ticket">
              <span className="noma-ticket-mark" aria-hidden="true">
                ↗
              </span>
              <div>
                <strong>Conversación → contexto → elección</strong>
                <small>Escena ilustrativa. Sin reservas reales.</small>
              </div>
            </div>
          </div>
        </section>
        <ProgressiveContent />
      </main>
      <PublicFooter />
    </div>
  );
}
