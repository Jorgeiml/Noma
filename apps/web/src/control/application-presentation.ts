import type { Application } from "./control-api";
export function applicantLabel(application: Pick<Application, "user">) {
  const name = application.user.name.trim();
  const addresses = application.user.emails ?? [];
  if (!/^cuenta\s+noma$/i.test(name))
    return (
      name ||
      addresses.map((e) => e.email).join(" · ") ||
      "Cuenta sin identificar"
    );
  return addresses.map((e) => e.email).join(" · ") || name;
}
export function applicationAccessLabel(application: Application) {
  if (application.platformReview?.decision === "REJECTED")
    return "Solicitud rechazada";
  const pilot = application.manualActivation;
  if (pilot) {
    const state = pilot.effectiveState ?? pilot.state;
    return (
      (
        {
          ACTIVE: "Piloto autorizado",
          SUSPENDED: "Piloto suspendido",
          REVOKED: "Piloto finalizado",
          EXPIRED: "Piloto vencido",
        } as Record<string, string>
      )[state] ?? "Revisar autorización"
    );
  }
  if (application.subscription?.state === "ACTIVE")
    return "Habilitado por suscripción";
  if (application.platformReview?.decision === "APPROVED")
    return "Falta habilitar el acceso";
  return "Pendiente de revisión y activación";
}
