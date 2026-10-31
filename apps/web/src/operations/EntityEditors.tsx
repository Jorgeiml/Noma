import { useState, type ReactNode } from "react";
import {
  staffApi,
  type Branch,
  type BranchDraft,
  type Configuration,
  type Professional,
  type ProfessionalDraft,
  type Resource,
  type ResourceDraft,
  type EntityKind,
} from "../api/staff";
import type { ServiceOffering } from "../api/offering";
import type { Perform } from "../Operations";
export type EditorProps = {
  cfg: Configuration;
  services: ServiceOffering[];
  busy: boolean;
  perform: Perform;
  dirty?: boolean;
  onProfessionalRemoved?: () => void;
};
function Actions({
  busy,
  dirty,
  kind,
  initial,
  perform,
  onRemoved,
}: {
  busy: boolean;
  dirty?: boolean;
  kind: EntityKind;
  initial?: Branch | Professional | Resource;
  perform: Perform;
  onRemoved?: () => void;
}) {
  return (
    <div className="save-row">
      <button disabled={busy}>{busy ? "Guardando…" : "Guardar ficha"}</button>
      {initial && (
        <button
          type="button"
          className="text-button"
          disabled={busy || dirty}
          onClick={() => {
            if (
              initial.active &&
              !window.confirm(
                "¿Desactivar esta ficha? Se conservarán sus datos y relaciones.",
              )
            )
              return;
            void perform(() =>
              staffApi.status(
                kind,
                initial.id,
                !initial.active,
                initial.version,
              ),
            );
          }}
        >
          {initial.active ? "Desactivar" : "Reactivar"}
        </button>
      )}
      {kind === "professionals" && initial && "displayName" in initial && (
        <button
          type="button"
          className="text-button danger-button"
          disabled={busy || dirty}
          onClick={() => {
            if (
              !window.confirm(
                `¿Eliminar permanentemente a «${initial.displayName}»? Se quitarán sus asignaciones, horarios y excepciones. Los servicios y las sucursales se conservan. Esta acción no se puede deshacer.`,
              )
            )
              return;
            void perform(
              async () => {
                const result = await staffApi.removeProfessional(
                  initial.id,
                  initial.version,
                );
                onRemoved?.();
                return result;
              },
              false,
              "Profesional eliminado del equipo.",
            );
          }}
        >
          Eliminar profesional
        </button>
      )}
    </div>
  );
}
function Form({
  children,
  busy,
  onSave,
}: {
  children: ReactNode;
  busy: boolean;
  onSave: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <fieldset disabled={busy}>{children}</fieldset>
    </form>
  );
}
export function BranchEditor({
  initial,
  timeZone,
  busy,
  perform,
  dirty,
}: EditorProps & { initial?: Branch; timeZone: string }) {
  const [draft, setDraft] = useState<BranchDraft>(
    initial
      ? {
          name: initial.name,
          address: initial.address,
          timeZone: initial.timeZone,
          isDefault: initial.isDefault,
        }
      : { name: "", address: null, timeZone, isDefault: false },
  );
  return (
    <Form
      busy={busy}
      onSave={() =>
        void perform(
          () => staffApi.branch(draft, initial?.id, initial?.version),
          true,
        )
      }
    >
      <legend>{initial ? "Editar sucursal" : "Tu próxima sucursal"}</legend>
      <p>
        Define un lugar real de trabajo. Elegir una principal es opcional y
        explícito.
      </p>
      <label htmlFor="branch-name">Nombre de sucursal</label>
      <input
        id="branch-name"
        required
        maxLength={120}
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <label htmlFor="branch-address">Dirección comercial (opcional)</label>
      <input
        id="branch-address"
        maxLength={250}
        value={draft.address ?? ""}
        onChange={(e) =>
          setDraft({ ...draft, address: e.target.value || null })
        }
      />
      <label htmlFor="branch-zone">Zona horaria de sucursal</label>
      <input
        id="branch-zone"
        required
        maxLength={64}
        list="branch-zones"
        value={draft.timeZone}
        onChange={(e) => setDraft({ ...draft, timeZone: e.target.value })}
      />
      <datalist id="branch-zones">
        {Intl.supportedValuesOf("timeZone").map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      <label className="check-label">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
        />
        Sucursal principal
      </label>
      <p className="field-help">
        Si eliges esta sucursal, se retira la marca principal de la anterior. La
        zona no se puede cambiar mientras tenga horarios vinculados.
      </p>
      <Actions
        busy={busy}
        dirty={dirty}
        kind="branches"
        initial={initial}
        perform={perform}
      />
    </Form>
  );
}
function toggle(values: string[], id: string) {
  return values.includes(id) ? values.filter((v) => v !== id) : [...values, id];
}
export function ProfessionalEditor({
  initial,
  cfg,
  services,
  busy,
  perform,
  dirty,
  onProfessionalRemoved,
}: EditorProps & { initial?: Professional }) {
  const [draft, setDraft] = useState<ProfessionalDraft>(
    initial
      ? {
          displayName: initial.displayName,
          specialty: initial.specialty,
          branchIds: initial.branchIds,
          serviceIds: initial.serviceIds,
        }
      : { displayName: "", specialty: null, branchIds: [], serviceIds: [] },
  );
  return (
    <Form
      busy={busy}
      onSave={() =>
        void perform(
          () => staffApi.professional(draft, initial?.id, initial?.version),
          true,
        )
      }
    >
      <legend>
        {initial ? "Datos del profesional" : "Incorpora un profesional"}
      </legend>
      <p>
        Una persona que presta servicios. No necesita correo ni cuenta de
        acceso.
      </p>
      <label htmlFor="professional-name">Nombre visible</label>
      <input
        id="professional-name"
        required
        maxLength={120}
        value={draft.displayName}
        onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
      />
      <label htmlFor="professional-specialty">
        Especialidad o descripción (opcional)
      </label>
      <textarea
        id="professional-specialty"
        maxLength={500}
        value={draft.specialty ?? ""}
        onChange={(e) =>
          setDraft({ ...draft, specialty: e.target.value || null })
        }
      />
      <fieldset className="association-list">
        <legend>Dónde trabaja</legend>
        {!cfg.branches.length && (
          <p>
            Crea una sucursal en la pestaña Sucursales para poder asignarla.
          </p>
        )}
        {cfg.branches.map((b) => (
          <label className="check-label" key={b.id}>
            <input
              type="checkbox"
              checked={draft.branchIds.includes(b.id)}
              disabled={!b.active && !draft.branchIds.includes(b.id)}
              onChange={() =>
                setDraft({ ...draft, branchIds: toggle(draft.branchIds, b.id) })
              }
            />
            {b.name}
            {!b.active ? " · Inactiva" : ""}
          </label>
        ))}
      </fieldset>
      <fieldset className="association-list">
        <legend>Qué servicios puede realizar</legend>
        {!services.length && (
          <p>Configura primero tus servicios en el catálogo.</p>
        )}
        {services.map((s) => (
          <label className="check-label" key={s.id}>
            <input
              type="checkbox"
              checked={draft.serviceIds.includes(s.id)}
              disabled={!s.active && !draft.serviceIds.includes(s.id)}
              onChange={() =>
                setDraft({
                  ...draft,
                  serviceIds: toggle(draft.serviceIds, s.id),
                })
              }
            />
            {s.name}
            {!s.active ? " · Inactivo" : ""}
          </label>
        ))}
      </fieldset>
      {initial && (
        <p className="field-help">
          Cuándo trabaja: abre Horarios y elige su sucursal y su nombre. Una
          asignación por sí sola no crea un horario.
        </p>
      )}
      <Actions
        busy={busy}
        dirty={dirty}
        kind="professionals"
        onRemoved={onProfessionalRemoved}
        initial={initial}
        perform={perform}
      />
    </Form>
  );
}
export function ResourceEditor({
  initial,
  cfg,
  busy,
  perform,
  dirty,
}: EditorProps & { initial?: Resource }) {
  const [draft, setDraft] = useState<ResourceDraft>(
    initial
      ? {
          branchId: initial.branchId,
          name: initial.name,
          typeDescription: initial.typeDescription,
          capacity: initial.capacity,
        }
      : { branchId: "", name: "", typeDescription: null, capacity: 1 },
  );
  return (
    <Form
      busy={busy}
      onSave={() =>
        void perform(
          () => staffApi.resource(draft, initial?.id, initial?.version),
          true,
        )
      }
    >
      <legend>
        {initial ? "Editar espacio o equipo" : "Añadir espacio o equipo"}
      </legend>
      <p>
        Un espacio o equipo que necesitas para atender: por ejemplo, una silla
        de barbería, una cabina o un aparato compartido.
      </p>
      <label htmlFor="resource-branch">Sucursal</label>
      <select
        id="resource-branch"
        required
        disabled={Boolean(initial)}
        value={draft.branchId}
        onChange={(e) => setDraft({ ...draft, branchId: e.target.value })}
      >
        <option value="">Elige una sucursal</option>
        {cfg.branches
          .filter((b) => b.active || b.id === initial?.branchId)
          .map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {!b.active ? " · Inactiva" : ""}
            </option>
          ))}
      </select>
      <label htmlFor="resource-name">Nombre del espacio o equipo</label>
      <input
        id="resource-name"
        placeholder="Por ejemplo, Sillón de barbería 1"
        required
        maxLength={120}
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <label htmlFor="resource-type">Descripción (opcional)</label>
      <textarea
        id="resource-type"
        maxLength={500}
        value={draft.typeDescription ?? ""}
        onChange={(e) =>
          setDraft({ ...draft, typeDescription: e.target.value || null })
        }
      />
      <label htmlFor="resource-capacity">Cantidad que tienes</label>
      <input
        id="resource-capacity"
        aria-describedby="resource-capacity-help"
        type="number"
        min={1}
        max={2147483647}
        step={1}
        required
        value={Number.isNaN(draft.capacity) ? "" : draft.capacity}
        onChange={(e) =>
          setDraft({ ...draft, capacity: e.target.valueAsNumber })
        }
      />
      <p className="field-help" id="resource-capacity-help">
        Puedes agrupar elementos iguales o registrar cada uno por separado.
      </p>
      <Actions
        busy={busy}
        dirty={dirty}
        kind="resources"
        initial={initial}
        perform={perform}
      />
    </Form>
  );
}
export function RequirementsEditor(
  props: EditorProps & {
    revision: number;
    choose: (action: () => void) => void;
    onDirty: () => void;
  },
) {
  const [branchId, setBranch] = useState(""),
    [serviceId, setService] = useState("");
  return (
    <section className="requirements-panel">
      <h2>Qué usa cada servicio</h2>
      <p>Elige el servicio y marca los espacios o equipos que usa.</p>
      <fieldset disabled={props.busy} className="form-pair">
        <div>
          <label htmlFor="requirement-branch">Sucursal</label>
          <select
            id="requirement-branch"
            value={branchId}
            onChange={(e) => props.choose(() => setBranch(e.target.value))}
          >
            <option value="">Elige sucursal</option>
            {props.cfg.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {!b.active ? " · Inactiva" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="requirement-service">Servicio</label>
          <select
            id="requirement-service"
            value={serviceId}
            onChange={(e) => props.choose(() => setService(e.target.value))}
          >
            <option value="">Elige servicio</option>
            {props.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {!s.active ? " · Inactivo" : ""}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      {branchId && serviceId && (
        <RequirementForm
          key={`${branchId}-${serviceId}-${props.revision}`}
          {...props}
          branchId={branchId}
          serviceId={serviceId}
        />
      )}
    </section>
  );
}
function RequirementForm({
  cfg,
  branchId,
  serviceId,
  busy,
  perform,
  onDirty,
}: EditorProps & { branchId: string; serviceId: string; onDirty: () => void }) {
  const initial = cfg.requirements.find(
    (r) => r.branchId === branchId && r.serviceId === serviceId,
  );
  const [resources, setResources] = useState(
    initial?.resources.map((r) => ({
      resourceId: r.resourceId,
      units: r.units,
    })) ?? [],
  );
  return (
    <form
      onChange={onDirty}
      onSubmit={(e) => {
        e.preventDefault();
        void perform(() =>
          staffApi.requirements(
            branchId,
            serviceId,
            resources,
            initial?.version ?? null,
          ),
        );
      }}
    >
      <fieldset disabled={busy}>
        <legend className="sr-only">
          Espacios y equipos que usa este servicio
        </legend>
        {!cfg.resources.some((r) => r.branchId === branchId) && (
          <p>Esta sucursal aún no tiene espacios o equipos registrados.</p>
        )}
        {cfg.resources
          .filter((r) => r.branchId === branchId)
          .map((r) => {
            const selected = resources.find((x) => x.resourceId === r.id);
            return (
              <div key={r.id} className="requirement-row">
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={Boolean(selected)}
                    disabled={!r.active && !selected}
                    onChange={() =>
                      setResources(
                        selected
                          ? resources.filter((x) => x.resourceId !== r.id)
                          : [...resources, { resourceId: r.id, units: 1 }],
                      )
                    }
                  />
                  {r.name} · cantidad total: {r.capacity}
                  {!r.active ? " · Inactivo" : ""}
                </label>
                {selected && (
                  <label>
                    Cantidad para este servicio
                    <span className="sr-only"> · {r.name}</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={r.capacity}
                      step={1}
                      value={Number.isNaN(selected.units) ? "" : selected.units}
                      onChange={(e) =>
                        setResources(
                          resources.map((x) =>
                            x.resourceId === r.id
                              ? { ...x, units: e.target.valueAsNumber }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                )}
              </div>
            );
          })}
        <button disabled={busy}>Guardar selección</button>
      </fieldset>
    </form>
  );
}
