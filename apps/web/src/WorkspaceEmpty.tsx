import type { ReactNode } from "react";
import { Nomi, type NomiMood } from "./public/Nomi";
export function WorkspaceEmpty({
  title,
  children,
  mood = "listening",
}: {
  title: string;
  children?: ReactNode;
  mood?: NomiMood;
}) {
  return (
    <div className="os-empty">
      <Nomi mood={mood} />
      <div>
        <p className="eyebrow">Un espacio para hacerlo tuyo</p>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
