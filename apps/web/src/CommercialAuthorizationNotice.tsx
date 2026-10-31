import type { CommercialAccount } from "./api/commercial";
export function CommercialAuthorizationNotice({
  account,
}: {
  account: CommercialAccount;
}) {
  const pilot = account.manualActivation;
  if (pilot) {
    const expires = new Intl.DateTimeFormat("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(pilot.expiresAt));
    return (
      <p className="noma-access-notice" role="status">
        {pilot.accessAuthorized ? (
          <>
            Piloto manual autorizado hasta {expires}. No representa un pago ni
            una renovación automática.{" "}
            {pilot.onboardingAuthorized
              ? "El alta futura está autorizada; la creación del negocio todavía no está disponible. No se creó un establecimiento automáticamente."
              : "Elige tu establecimiento autorizado para entrar."}
          </>
        ) : (
          <>
            Tu piloto está{" "}
            {pilot.state === "EXPIRED"
              ? "vencido"
              : pilot.state === "SUSPENDED"
                ? "suspendido"
                : pilot.state === "REVOKED"
                  ? "finalizado"
                  : "sin acceso autorizado"}
            . Vencimiento registrado: {expires}. Tus datos se conservan.
          </>
        )}
      </p>
    );
  }
  return (
    <p className="noma-access-notice" role="status">
      {account.application?.review === "REJECTED"
        ? "Tu solicitud no fue aprobada. Tu identidad y tus datos se conservan; puedes solicitar una revisión al equipo de Noma."
        : "Tu solicitud fue aprobada. El acceso operativo requiere una autorización vigente y una membresía válida. La aprobación no registra un pago ni crea un negocio."}
    </p>
  );
}
