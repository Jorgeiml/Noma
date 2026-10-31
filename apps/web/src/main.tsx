import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SiteRouter } from "./SiteRouter";
import "./base.css";

const root = document.getElementById("root");
if (!root)
  throw new Error("No se encontró el punto de entrada de la aplicación.");

createRoot(root).render(
  <StrictMode>
    <SiteRouter />
  </StrictMode>,
);
