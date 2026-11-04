import { useState } from "react";
import { commercialApi, type CommercialAccount } from "./api/commercial";
import type { PlanId } from "../../api/src/commercial/plan.contract";
import { Pricing } from "./public/Pricing";
import { Nomi } from "./public/Nomi";
import { CommercialAuthorizationNotice } from "./CommercialAuthorizationNotice";

export function hasReadyBusiness(account: CommercialAccount) {
  return account.memberships.some(
    (member) =>
      member.establishmentStatus === "ACTIVE" &&
      member.subscriptionState === "ACTIVE",
  );
}

export function AccountWelcome({
  account,
  busy,
  run,
  onAccount,
  onNotice,
}: {
  account: CommercialAccount;
  busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  onAccount: (account: CommercialAccount) => void;
  onNotice: (notice: string) => void;
}) {
  const [plan, setPlan] = useState<PlanId>(
    account.application?.selectedPlan ?? "GROW",
  );
  const canSave =
    !!account.application &&
    ["IDENTITY_VERIFIED", "PLAN_SELECTED"].includes(account.application.state);
  const readyBusiness = hasReadyBusiness(account);
  const hasAccess = account.manualActivation?.accessAuthorized || readyBusiness;
  if (!account.user.verified)
    return (
      <div>
        <h1>Un paso antes de continuar.</h1>
        <p>Verifica tu correo para elegir tu plan.</p>
        <a href="/verificar-correo" className="noma-button">
          Verificar mi correo
        </a>
      </div>
    );
  if (hasAccess)
    return (
      <header className="noma-account-ready">
        <Nomi mood="celebrate" className="noma-free-welcome-character" />
        <h1>{readyBusiness ? "Tus negocios" : "Configura tu negocio"}</h1>
        <p>
          {readyBusiness
            ? "Elige el negocio que quieres abrir."
            : "Completa la configuración para entrar al panel."}
        </p>
      </header>
    );
  if (account.manualActivation)
    return (
      <header className="noma-account-ready">
        <Nomi mood="listening" className="noma-free-welcome-character" />
        <p className="noma-kicker">TU ESPACIO SE CONSERVA</p>
        <h1>Revisemos tu acceso.</h1>
        <h2>Plan {account.manualActivation.plan}</h2>
        <CommercialAuthorizationNotice account={account} />
        <p>
          Tu negocio y tu configuración se conservan. Contacta con el equipo de
          Noma para revisar la vigencia de tu acceso gratuito.
        </p>
      </header>
    );
  return (
    <>
      <header className="noma-account-celebration">
        <div>
          <p className="noma-kicker">
            REGISTRO COMPLETADO · {account.user.email}
          </p>
          <h1>
            Tu próximo gran paso
            <br />
            empieza aquí.
          </h1>
          <p>
            Tu cuenta ya está lista. Encuentra el plan para llevar tu negocio a
            otro nivel.
          </p>
          <a className="noma-button" href="#account-plans">
            Descubre tu plan <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="noma-account-character">
          <Nomi mood="energized" />
          <span>¡Vamos con todo!</span>
        </div>
      </header>
      <ol className="noma-account-steps" aria-label="Cómo empezar con Noma">
        <li data-complete="true">
          <span>✓</span>
          <div>
            <strong>Crea tu cuenta</strong>
            <small>Listo, ya estás aquí.</small>
          </div>
        </li>
        <li aria-current="step">
          <span>02</span>
          <div>
            <strong>Elige tu plan</strong>
            <small>Encuentra el que va contigo.</small>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <strong>Activa tu plan</strong>
            <small>Pago confirmado · próximamente.</small>
          </div>
        </li>
        <li>
          <span>04</span>
          <div>
            <strong>Prepara tu negocio</strong>
            <small>Después de activar tu plan.</small>
          </div>
        </li>
      </ol>
      <section
        id="account-plans"
        className="noma-account-plans"
        aria-label="Planes de Noma"
      >
        <Pricing selection={{ plan, disabled: busy, onSelect: setPlan }} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            void run(async () => {
              await commercialApi.selectPlan(plan);
              onAccount(await commercialApi.account());
              onNotice(
                "Plan de interés guardado. Te lo mostraremos cuando vuelvas. No se realizó ningún cobro ni se activó una suscripción.",
              );
            });
          }}
        >
          <div className="noma-account-plan-footer">
            <div>
              <strong>
                Propuestas de precios, aún no disponibles para contratar.
              </strong>
            </div>
            {canSave ? (
              <button className="noma-button" disabled={busy}>
                {busy ? "Guardando…" : "Guardar plan de interés"}
              </button>
            ) : (
              <p>
                Plan de interés registrado:{" "}
                <strong>
                  {account.application?.selectedPlan ?? "Sin elegir"}
                </strong>
                . Explorar otros planes aquí no cambia tu registro.
              </p>
            )}
          </div>
        </form>
        <details className="noma-account-faq">
          <summary>¿Cuándo ingreso los datos de mi negocio?</summary>
          <p>
            En la preparación guiada, una vez habilitado tu acceso: nombre del
            negocio, giro, sucursales, servicios, profesionales y horarios.
            Registrarte no crea un local automáticamente.
          </p>
        </details>
      </section>
      {(account.manualActivation || account.application?.selectedPlan) && (
        <details className="noma-account-pilot">
          <summary>Acceso anticipado de prueba</summary>
          <p>
            El piloto es una excepción temporal mientras preparamos la
            contratación. No equivale a una suscripción pagada.
          </p>
          {account.manualActivation ? (
            <CommercialAuthorizationNotice account={account} />
          ) : account.application?.state === "PLAN_SELECTED" ? (
            <button
              className="noma-text-action"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await commercialApi.requestActivation();
                  onAccount(await commercialApi.account());
                  onNotice(
                    "Interés en el piloto registrado. El equipo de Noma revisará la disponibilidad; tu acceso todavía no está activo.",
                  );
                })
              }
            >
              Quiero participar en el piloto
            </button>
          ) : (
            <p>
              {account.application?.review === "REJECTED"
                ? "Tu participación no fue habilitada. Puedes consultar al equipo de Noma."
                : "Tu interés en el piloto está registrado. El equipo de Noma debe confirmar su disponibilidad y habilitar el acceso temporal."}
            </p>
          )}
        </details>
      )}
    </>
  );
}
