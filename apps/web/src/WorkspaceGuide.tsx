import { useEffect, useRef, useState } from "react";
import { Nomi } from "./public/Nomi";
const steps = [
  {
    title: "Tu negocio, a tu manera.",
    text: "En Negocio puedes añadir tu logo, editar los datos comerciales y elegir moneda y zona horaria. Es la identidad del establecimiento, no una sucursal física.",
    label: "Negocio",
  },
  {
    title: "Dale forma a tu oferta.",
    text: "En Servicios organizas lo que ofreces: nombre, categoría, duración y precio. Puedes poner un precio fijo, desde un mínimo, un rango o pedir una valoración previa.",
    label: "Servicios",
  },
  {
    title: "Personas, lugares y tiempos.",
    text: "En Equipo registras profesionales, los asignas a servicios y sucursales, y defines sus horarios. En Horarios también puedes registrar ausencias y cambios por fecha.",
    label: "Equipo",
  },
  {
    title: "Espacios y equipos, en su lugar.",
    text: "Registra las sillas, cabinas, salas y equipos de cada sucursal. En «Lo que tienes» indicas cuántos hay. En «Qué usa cada servicio» marcas cuáles necesita ese servicio y cuántos utiliza.",
    label: "Espacios y equipos",
  },
];
export function WorkspaceGuide({
  identityKey,
  disabled,
}: {
  identityKey: string;
  disabled: boolean;
}) {
  const storageKey = `noma.guide.v1:${identityKey}`;
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== "seen";
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      if (!dialog.current?.open) {
        if (dialog.current?.showModal) dialog.current.showModal();
        else dialog.current?.setAttribute("open", "");
      }
      wasOpen.current = true;
    } else if (wasOpen.current) {
      dialog.current?.close?.();
      dialog.current?.removeAttribute("open");
      trigger.current?.focus();
    }
  }, [open]);
  function finish() {
    try {
      localStorage.setItem(storageKey, "seen");
    } catch {
      /* The guide still closes when storage is unavailable. */
    }
    setOpen(false);
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="text-button os-guide-trigger"
        disabled={disabled}
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        aria-label="Guía rápida"
      >
        <span aria-hidden="true">?</span>
        <span className="guide-trigger-label">Guía rápida</span>
      </button>
      <dialog
        ref={dialog}
        className="os-guide"
        aria-labelledby="guide-title"
        aria-describedby="guide-text"
        onCancel={finish}
        onClose={() => {
          if (open) finish();
        }}
      >
        <div className="guide-top">
          <span className="eyebrow">
            Conoce tu espacio · {step + 1} de {steps.length}
          </span>
          <button type="button" className="text-button" onClick={finish}>
            Omitir guía
          </button>
        </div>
        <div className="guide-body">
          <Nomi mood={step === steps.length - 1 ? "confirm" : "welcome"} />
          <p className="eyebrow">{steps[step]!.label}</p>
          <h2 id="guide-title" tabIndex={-1}>
            {steps[step]!.title}
          </h2>
          <p id="guide-text">{steps[step]!.text}</p>
        </div>
        <div className="guide-bottom">
          <span aria-hidden="true" className="guide-progress">
            {steps.map((_, i) => (
              <span key={i} data-current={i === step} />
            ))}
          </span>
          {step > 0 && (
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setStep(step - 1);
                requestAnimationFrame(() =>
                  document.getElementById("guide-title")?.focus(),
                );
              }}
            >
              Anterior
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (step === steps.length - 1) finish();
              else {
                setStep(step + 1);
                requestAnimationFrame(() =>
                  document.getElementById("guide-title")?.focus(),
                );
              }
            }}
          >
            {step === steps.length - 1 ? "Empezar a trabajar" : "Siguiente"}
          </button>
        </div>
      </dialog>
    </>
  );
}
