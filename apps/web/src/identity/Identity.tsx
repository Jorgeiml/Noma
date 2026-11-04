import { createContext, useContext, type ReactNode } from "react";
import { Nomi, type NomiMood } from "../public/Nomi";
import { identityTokens, personality } from "./personality";
import "./identity.css";
const IdentityContext = createContext(personality());
export const usePersonality = () => useContext(IdentityContext);
export function IdentityScope({
  vertical,
  children,
  className = "",
}: {
  vertical?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const theme = personality(vertical);
  return (
    <IdentityContext.Provider value={theme}>
      <div
        className={`identity-scope ${className}`}
        data-personality={theme.label}
        style={identityTokens(theme)}
      >
        {children}
      </div>
    </IdentityContext.Provider>
  );
}
export function IdentityIcon({ vertical }: { vertical?: string | null }) {
  const theme = personality(vertical);
  return (
    <svg
      className="identity-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={theme.motif} />
    </svg>
  );
}
export function ContextualNomi({ mood = "listening" }: { mood?: NomiMood }) {
  const theme = usePersonality();
  return <Nomi mood={mood} scene={theme.scene} />;
}
