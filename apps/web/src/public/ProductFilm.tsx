import { useState } from "react";
import { Nomi, type NomiMood } from "./Nomi";
import { publicContactUrl } from "./demo-scenarios";

const frames: {
  title: string;
  text: string;
  mood: NomiMood;
  number: string;
}[] = [
  {
    number: "01",
    title: "Todo empieza con un hola.",
    text: "«¿Tienen un espacio para el viernes?»",
    mood: "listening",
  },
  {
    number: "02",
    title: "El contexto cambia la respuesta.",
    text: "Servicio, profesional, espacio y reglas del negocio.",
    mood: "thinking",
  },
  {
    number: "03",
    title: "Una posibilidad. Tú decides.",
    text: "La futura reserva deberá validar disponibilidad antes de confirmar.",
    mood: "confirm",
  },
];
export function publicVideoUrl(value: string | undefined) {
  const url = publicContactUrl(value);
  return url && /\.(mp4|webm)$/i.test(new URL(url).pathname) ? url : null;
}
export function ProductFilm() {
  const [frame, setFrame] = useState<number | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [watch, setWatch] = useState(false);
  const video = publicVideoUrl(import.meta.env.VITE_PUBLIC_VIDEO_URL);
  const current = frames[frame ?? 0]!;
  return (
    <section className="noma-film-section" aria-labelledby="noma-film-title">
      <div className="noma-film-intro">
        <p className="noma-kicker">MENOS LEER. MÁS ENTENDER.</p>
        <h2 id="noma-film-title">Una idea que se ve.</h2>
        <p>
          Recepción, contexto y operación, conectados. Conoce el recorrido sin
          hacer scroll hasta mañana.
        </p>
        <a className="noma-text-link" href="/demo">
          Probar la demo interactiva<span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="noma-film-wrap">
        <div className="noma-film">
          {video && watch && !videoFailed ? (
            <video
              controls
              playsInline
              preload="none"
              aria-label="Video de presentación de Noma"
              onError={() => setVideoFailed(true)}
            >
              <source
                src={video}
                type={
                  new URL(video).pathname.toLowerCase().endsWith(".webm")
                    ? "video/webm"
                    : "video/mp4"
                }
                onError={() => setVideoFailed(true)}
              />
              Tu navegador no admite este video.
            </video>
          ) : (
            <>
              <div className="noma-film-label">
                <span>noma / en contexto</span>
                <span>
                  {video && !videoFailed ? "VIDEO" : "ADELANTO ILUSTRATIVO"}
                </span>
              </div>
              <div className="noma-film-scene">
                <Nomi mood={frame === null ? "welcome" : current.mood} />
                <div className="noma-film-caption" aria-live="polite">
                  <span>
                    {frame === null
                      ? "UN PRIMER VISTAZO"
                      : `${current.number} / 03`}
                  </span>
                  <h3>
                    {frame === null
                      ? "La atención tiene mucho detrás."
                      : current.title}
                  </h3>
                  <p>
                    {frame === null
                      ? "Estamos preparando el video. Mientras tanto, explora esta breve historia."
                      : current.text}
                  </p>
                  {video && !videoFailed ? (
                    <button
                      className="noma-button"
                      onClick={() => setWatch(true)}
                    >
                      Ver video<span aria-hidden="true">▷</span>
                    </button>
                  ) : (
                    <button className="noma-button" onClick={() => setFrame(0)}>
                      {frame === null ? "Ver adelanto" : "Reiniciar adelanto"}
                      <span aria-hidden="true">▷</span>
                    </button>
                  )}
                </div>
              </div>
              {frame !== null && (
                <div
                  className="noma-film-controls"
                  role="group"
                  aria-label="Escenas del adelanto"
                >
                  {frames.map((item, index) => (
                    <button
                      key={item.number}
                      aria-label={`Escena ${item.number}: ${item.title}`}
                      aria-pressed={frame === index}
                      onClick={() => setFrame(index)}
                    >
                      <span>{item.number}</span>
                      {index === frame ? item.title : ""}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <p className="noma-film-disclosure">
          {videoFailed
            ? "No se pudo reproducir el video. Puedes explorar el adelanto o la demo."
            : video
              ? "Video de presentación. La demo interactiva se puede explorar por separado."
              : "Video real próximamente · Este adelanto es una ilustración interactiva, no una grabación del producto ni una reserva real."}
        </p>
      </div>
    </section>
  );
}
