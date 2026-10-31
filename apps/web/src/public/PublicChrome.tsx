import { useRef, useState } from "react";
export function NomaWordmark() {
  return (
    <span className="noma-wordmark">
      <svg viewBox="0 0 28 28" aria-hidden="true" width="28" height="28">
        <path
          d="M4 23V9c0-6 8-6 10 0l1 10c1 6 9 6 9 0V5"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      noma
      <span className="noma-name-dot" aria-hidden="true">
        .
      </span>
    </span>
  );
}
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <a className="noma-skip" href="#noma-content">
        Saltar al contenido
      </a>
      <header
        className="noma-header"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            button.current?.focus();
          }
        }}
      >
        <a href="/" aria-label="Noma · Inicio">
          <NomaWordmark />
        </a>
        <button
          ref={button}
          className="noma-menu-toggle"
          aria-controls="noma-public-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Cerrar menú" : "Menú"}
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
        <nav
          id="noma-public-navigation"
          aria-label="Navegación pública"
          data-open={open}
          onClick={() => setOpen(false)}
        >
          <a href="/#recorrido">Cómo funciona</a>
          <a href="/#sectores">Para tu negocio</a>
          <a href="/#planes">Precios</a>
          <a className="noma-login-link" href="/login">
            Acceder <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
    </>
  );
}
export function PublicFooter() {
  return (
    <footer className="noma-footer">
      <a href="/" aria-label="Noma · Inicio">
        <NomaWordmark />
      </a>
      <p>Noma · nombre provisional. En desarrollo.</p>
      <nav aria-label="Enlaces del pie">
        <a href="/demo">Demo</a>
        <a href="/#preguntas">Preguntas frecuentes</a>
      </nav>
      <span className="noma-footer-note">Hecho en Ecuador por VérticeEC</span>
    </footer>
  );
}
