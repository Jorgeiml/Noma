import { useRef, useState, type ChangeEvent } from "react";
import { platformApi, type Establishment } from "./api/platform";

export async function prepareLogo(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("Elige una imagen PNG, JPG o WebP de hasta 5 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(
      "No pudimos leer la imagen. Prueba con otro archivo PNG, JPG o WebP.",
    );
  });
  try {
    let scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("No pudimos preparar esta imagen. Intenta con otra.");
    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const value = canvas.toDataURL("image/png");
      if (value.length <= 87000) return value;
      scale *= 0.75;
    }
    throw new Error("No pudimos adaptar esta imagen. Prueba con otro archivo.");
  } finally {
    bitmap.close();
  }
}
export function BusinessLogo({
  saved,
  disabled,
  onSaved,
  onBusyChange,
}: {
  saved: Establishment;
  disabled: boolean;
  onSaved: (value: Establishment) => void;
  onBusyChange: (value: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function update(file: File | null) {
    if (busy || disabled) return;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setNotice("");
    try {
      const logo = file ? await prepareLogo(file) : null;
      onSaved(await platformApi.logo(saved.id, logo, saved.version));
      setNotice(file ? "Logo guardado." : "Logo eliminado.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No pudimos guardar el logo. Intenta otra vez.",
      );
    } finally {
      setBusy(false);
      onBusyChange(false);
      if (input.current) input.current.value = "";
    }
  }
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void update(file);
  }
  return (
    <div
      className="business-logo-editor"
      aria-label="Logo del negocio"
      aria-busy={busy}
    >
      {saved.logoDataUrl ? (
        <img
          className="business-logo-image"
          src={saved.logoDataUrl}
          alt={`Logo de ${saved.commercialName}`}
          width="72"
          height="72"
        />
      ) : (
        <div className="business-monogram" aria-hidden="true">
          {saved.commercialName.slice(0, 2).toLocaleUpperCase("es")}
        </div>
      )}
      <input
        ref={input}
        type="file"
        tabIndex={-1}
        accept="image/png,image/jpeg,image/webp"
        onChange={choose}
        className="sr-only"
        aria-label="Seleccionar logo del negocio"
        disabled={disabled || busy}
      />
      <div className="logo-actions">
        <button
          className="text-button"
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
        >
          {busy
            ? "Guardando logo…"
            : saved.logoDataUrl
              ? "Cambiar logo"
              : "Añadir logo"}
        </button>
        {saved.logoDataUrl && (
          <button
            className="text-button"
            type="button"
            disabled={disabled || busy}
            onClick={() => {
              if (
                window.confirm(
                  "¿Quitar el logo de tu negocio? Podrás volver a subirlo.",
                )
              )
                void update(null);
            }}
          >
            Quitar logo
          </button>
        )}
      </div>
      <p className="field-help">
        PNG, JPG o WebP · hasta 5 MB.{" "}
        {disabled
          ? "Guarda los cambios del perfil antes de cambiar el logo."
          : "Se adapta automáticamente para tu negocio."}
      </p>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="success-message">
          {notice}
        </p>
      )}
    </div>
  );
}
