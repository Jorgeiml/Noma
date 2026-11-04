import { type ReactNode } from "react";
import { NomaWordmark } from "./public/PublicChrome";
import "./studio-os.css";
import { IdentityScope, IdentityIcon } from "./identity/Identity";
import type { Vertical } from "./identity/personality";
import { WorkspaceGuide } from "./WorkspaceGuide";

/** Presentation only. Authentication and authorized context stay with Workspace. */
export function AdminShell({
  authorized,
  businessName,
  vertical,
  businessLogo,
  guideKey,
  userName,
  canSwitch,
  busy,
  onLogout,
  children,
}: {
  authorized: boolean;
  businessName?: string;
  vertical?: Vertical | null;
  businessLogo?: string | null;
  guideKey?: string;
  userName?: string;
  canSwitch: boolean;
  busy: boolean;
  onLogout: () => void;
  children: ReactNode;
}) {
  if (!authorized) return children;
  return (
    <IdentityScope className="studio-os" vertical={vertical}>
      <header className="os-header">
        <a className="os-brand" href="/" aria-label="Noma · Inicio público">
          <NomaWordmark />
        </a>
        <div className="os-business">
          {businessLogo && (
            <img
              src={businessLogo}
              className="os-business-logo"
              alt=""
              width="32"
              height="32"
            />
          )}
          <span className="os-context-label">
            {vertical && <IdentityIcon vertical={vertical} />}Tu espacio de
            trabajo
          </span>
          <strong>{businessName}</strong>
        </div>
        {guideKey && (
          <WorkspaceGuide
            key={guideKey}
            identityKey={guideKey}
            disabled={busy}
          />
        )}
        <details
          className="os-account"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label="Cuenta y establecimiento">
            <span className="os-avatar" aria-hidden="true">
              {userName?.slice(0, 1).toLocaleUpperCase("es") || "N"}
            </span>
            <span className="os-account-label">Mi cuenta</span>
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="os-account-menu">
            <strong>{userName}</strong>
            <p>{businessName}</p>
            {canSwitch && (
              <a
                href="/activacion"
                aria-disabled={busy}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                Cambiar establecimiento
              </a>
            )}
            <button type="button" disabled={busy} onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        </details>
      </header>
      {children}
    </IdentityScope>
  );
}
