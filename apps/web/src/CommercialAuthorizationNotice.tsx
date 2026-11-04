import type { CommercialAccount } from "./api/commercial";
export function CommercialAuthorizationNotice({
  account,
}: {
  account: CommercialAccount;
}) {
  const pilot = account.manualActivation;
  if (pilot) {
    const modality =
      pilot.mode === "TEST"
        ? "Prueba gratuita"
        : pilot.mode === "COURTESY"
          ? "Cortesía gratuita"
          : "Piloto gratuito";
    const expires = new Intl.DateTimeFormat("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(pilot.expiresAt));
    return (
      <p className="noma-access-notice" role="status">
        {pilot.accessAuthorized ? (
          <>
            {modality} · vigente hasta {expires}. No representa un pago ni una
            renovación automática.{" "}
            {pilot.onboardingAuthorized
              ? "El alta está autorizada. Puedes preparar tu negocio paso a paso; no se crea un establecimiento automáticamente."
              : "Elige tu establecimiento autorizado para entrar."}
          </>
        ) : (
          <>
            Tu acceso gratuito está{" "}
            {pilot.state === "EXPIRED"
              ? "vencido"
              : pilot.state === "SUSPENDED"
                ? "suspendido"
                : pilot.state === "REVOKED"
                  ? "finalizado"
                  : pilot.state === "SCHEDULED"
                    ? "programado; todavía no comienza"
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
        : "Tu solicitud fue aprobada. El equipo de Noma todavía debe habilitar tu acceso; cuando lo haga, podrás preparar tu negocio. La aprobación no registra un pago ni crea un negocio."}
    </p>
  );
}
