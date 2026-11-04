import { useState, type ReactNode } from "react";
import type { OnboardingSnapshot, BusinessProfile } from "./onboarding-api";
import type {
  Branch,
  Professional,
  Resource,
  Schedule,
  WeekDay,
} from "../api/staff";
import {
  blankOffering,
  offeringDraft,
  priceLabel,
  type ServiceOffering,
  type OfferingDraft,
} from "../api/offering";
import { BusinessFields, COUNTRIES } from "./BusinessFields";
import { emptyWeek, ScheduleFields, DAY_NAMES } from "./ScheduleFields";
export type Save = (
  path: string,
  data: Record<string, unknown>,
) => Promise<boolean>;
type Props = {
  snapshot: OnboardingSnapshot;
  busy: boolean;
  save: Save;
  confirmDiscard?: () => boolean;
};
const saveButton = (busy: boolean, label = "Guardar y continuar") => (
  <button className="onboard-primary" disabled={busy}>
    {busy ? "Guardando…" : label}
  </button>
);
export function BusinessStep({ snapshot, busy, save }: Props) {
  const initial = snapshot.configuration?.business;
  const [value, setValue] = useState<BusinessProfile>(() =>
    initial
      ? { ...initial }
      : {
          commercialName: "",
          countryCode: "EC",
          city: "",
          address: null,
          businessPhone: "",
          businessEmail: "",
          timeZone: "America/Guayaquil",
          description: null,
          beautySubtype: null,
        },
  );
  const {
    commercialName,
    countryCode,
    city,
    address,
    businessPhone,
    businessEmail,
    timeZone,
    description,
    beautySubtype,
  } = value;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save("business", {
          business: {
            commercialName,
            countryCode,
            city,
            address,
            businessPhone,
            businessEmail,
            timeZone,
            description,
            beautySubtype,
          },
          ...(initial ? { entityVersion: initial.version } : {}),
        });
      }}
    >
      <BusinessFields
        value={value}
        required={!initial || !!snapshot.progress?.createdBusiness}
        onChange={(key, text) => setValue((v) => ({ ...v, [key]: text }))}
      />
      <p className="onboard-note">
        No necesitas RUC ni volver a introducir tu contraseña. El correo
        comercial es un dato de contacto y no cambia tu identidad de acceso.
      </p>
      {saveButton(busy)}
    </form>
  );
}
export function BranchStep({
  snapshot,
  busy,
  save,
  confirmDiscard = () => true,
}: Props) {
  const cfg = snapshot.configuration!;
  const [branchId, setBranchId] = useState(
    cfg.branches.find((b) => b.isDefault)?.id ?? cfg.branches[0]?.id ?? "",
  );
  const branch =
    cfg.branches.find((b) => b.id === branchId) ??
    cfg.branches.find((b) => b.isDefault) ??
    cfg.branches[0];
  return (
    <>
      <div className="onboard-section-label">
        <span>01</span>
        <h2>Un lugar para atender</h2>
      </div>
      {cfg.branches.length > 1 && (
        <label>
          Sucursal a configurar
          <select
            value={branchId}
            onChange={(e) => {
              if (confirmDiscard()) setBranchId(e.target.value);
            }}
          >
            {cfg.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <BranchForm
        key={branch?.id + ":" + branch?.version}
        initial={branch}
        timeZone={cfg.business.timeZone}
        busy={busy}
        save={save}
      />
      {branch && (
        <>
          <div className="onboard-section-label">
            <span>02</span>
            <h2>Tu semana de atención</h2>
          </div>
          <ScheduleForm
            key={
              branch.id +
              ":" +
              (cfg.schedules.find(
                (s) => s.branchId === branch.id && !s.professionalId,
              )?.version ?? "new")
            }
            branch={branch}
            schedules={cfg.schedules}
            busy={busy}
            save={save}
          />
        </>
      )}
    </>
  );
}
function BranchForm({
  initial,
  timeZone,
  busy,
  save,
}: {
  initial?: Branch;
  timeZone: string;
  busy: boolean;
  save: Save;
}) {
  const [name, setName] = useState(initial?.name ?? "Principal"),
    [address, setAddress] = useState(initial?.address ?? "");
  return (
    <form
      className="onboard-subform"
      onSubmit={(e) => {
        e.preventDefault();
        void save("branches", {
          data: {
            name,
            address: address || null,
            timeZone: initial?.timeZone ?? timeZone,
            isDefault: initial?.isDefault ?? true,
          },
          ...(initial
            ? { id: initial.id, entityVersion: initial.version }
            : {}),
        });
      }}
    >
      <div className="onboard-fields">
        <label>
          Nombre de la sucursal
          <input
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Dirección de la sucursal <span>Opcional</span>
          <input
            maxLength={250}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
      </div>
      <p className="onboard-muted">
        Zona horaria: {initial?.timeZone ?? timeZone}. Puedes administrar más
        sucursales desde Equipo, dentro de los límites de tu autorización.
      </p>
      {saveButton(busy, "Guardar sucursal")}
    </form>
  );
}
function ScheduleForm({
  branch,
  schedules,
  professionalId = null,
  busy,
  save,
}: {
  branch: Branch;
  schedules: Schedule[];
  professionalId?: string | null;
  busy: boolean;
  save: Save;
}) {
  const current = schedules.find(
    (s) => s.branchId === branch.id && s.professionalId === professionalId,
  );
  const [week, setWeek] = useState<WeekDay[]>(
    () => current?.week ?? emptyWeek(),
  );
  return (
    <form
      className="onboard-subform"
      onSubmit={(e) => {
        e.preventDefault();
        void save("schedules", {
          data: {
            branchId: branch.id,
            professionalId,
            timeZone: current?.timeZone ?? branch.timeZone,
            week,
            version: current?.version ?? null,
          },
        });
      }}
    >
      <ScheduleFields week={week} onChange={setWeek} />
      {saveButton(busy, "Guardar horario")}
    </form>
  );
}
const modes = {
  FIXED: "Precio fijo",
  FROM: "Desde",
  RANGE: "Rango de precios",
  ASSESSMENT_REQUIRED: "Precio después de valoración",
} as const;
export function ServicesStep({
  snapshot,
  busy,
  save,
  confirmDiscard = () => true,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState(false);
  const cfg = snapshot.configuration!,
    current = cfg.services.find((s) => s.id === selected);
  return (
    <>
      <p>
        Empieza con los servicios que realmente ofreces. Podrás ampliar el
        catálogo después.
      </p>
      <ul className="onboard-record-list">
        {cfg.services.map((service) => (
          <li key={service.id}>
            <button
              className="onboard-record-button"
              type="button"
              disabled={busy}
              onClick={() => {
                if (!confirmDiscard()) return;
                setSelected(service.id);
                setCreating(false);
              }}
            >
              <strong>{service.name}</strong>
              <span>
                {service.durationMinutes} min · {priceLabel(service)} ·{" "}
                {service.active ? "Activo" : "Inactivo"}
              </span>
              <span>Editar ↗</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        className="onboard-secondary"
        type="button"
        disabled={busy}
        onClick={() => {
          if (!confirmDiscard()) return;
          setSelected(null);
          setCreating(true);
        }}
      >
        Añadir servicio
      </button>
      {(creating || current || !cfg.services.length) && (
        <ServiceForm
          key={(current?.id ?? "new") + ":" + (current?.version ?? "0")}
          initial={current}
          currency={cfg.business.currency}
          busy={busy}
          save={async (path, data) => {
            const ok = await save(path, data);
            if (ok) {
              setCreating(false);
              setSelected(null);
            }
            return ok;
          }}
        />
      )}
      <p className="onboard-note">
        Podrás ajustar tus servicios y precios cuando quieras desde el catálogo.
      </p>
    </>
  );
}
function ServiceForm({
  initial,
  currency,
  busy,
  save,
}: {
  initial?: ServiceOffering;
  currency: string;
  busy: boolean;
  save: Save;
}) {
  const [value, setValue] = useState<OfferingDraft>(() =>
      initial
        ? offeringDraft(initial)
        : { ...blankOffering(), durationMinutes: 30 },
    ),
    [active, setActive] = useState(initial?.active ?? true);
  const change = (key: keyof OfferingDraft, value: unknown) =>
    setValue((d) => ({ ...d, [key]: value }));
  return (
    <form
      className="onboard-subform"
      onSubmit={(e) => {
        e.preventDefault();
        void save("services", {
          data: value,
          active,
          ...(initial
            ? { id: initial.id, entityVersion: initial.version }
            : {}),
        });
      }}
    >
      <h2>{initial ? "Editar servicio" : "Un servicio de tu negocio"}</h2>
      <div className="onboard-fields">
        <label>
          Nombre del servicio
          <input
            required
            maxLength={120}
            value={value.name}
            onChange={(e) => change("name", e.target.value)}
          />
        </label>
        <label>
          Categoría <span>Opcional</span>
          <input
            maxLength={80}
            value={value.category ?? ""}
            onChange={(e) => change("category", e.target.value || null)}
          />
        </label>
        <label>
          Duración en minutos
          <input
            type="number"
            min={1}
            required
            value={value.durationMinutes}
            onChange={(e) => change("durationMinutes", Number(e.target.value))}
          />
        </label>
        <label>
          Tipo de precio
          <select
            value={value.priceMode}
            onChange={(e) => {
              const mode = e.target.value as OfferingDraft["priceMode"];
              setValue((d) => ({
                ...d,
                priceMode: mode,
                priceMin:
                  mode === "ASSESSMENT_REQUIRED" ? null : (d.priceMin ?? "0"),
                priceMax: mode === "RANGE" ? (d.priceMax ?? "0") : null,
                hasPriorAssessment: mode === "ASSESSMENT_REQUIRED",
                assessmentDescription:
                  mode === "ASSESSMENT_REQUIRED"
                    ? (d.assessmentDescription ?? "")
                    : null,
              }));
            }}
          >
            {Object.entries(modes).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {value.priceMode !== "ASSESSMENT_REQUIRED" && (
          <label>
            {value.priceMode === "RANGE" ? "Precio mínimo" : "Precio"} ·{" "}
            {currency}
            <input
              inputMode="decimal"
              required
              pattern="[0-9]{1,14}(\.[0-9]{1,4})?"
              value={value.priceMin ?? ""}
              onChange={(e) => change("priceMin", e.target.value)}
            />
          </label>
        )}
        {value.priceMode === "RANGE" && (
          <label>
            Precio máximo · {currency}
            <input
              inputMode="decimal"
              required
              pattern="[0-9]{1,14}(\.[0-9]{1,4})?"
              value={value.priceMax ?? ""}
              onChange={(e) => change("priceMax", e.target.value)}
            />
          </label>
        )}
        <label className="onboard-wide">
          Descripción <span>Opcional</span>
          <textarea
            maxLength={2000}
            value={value.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </label>
        {value.priceMode === "ASSESSMENT_REQUIRED" && (
          <label className="onboard-check onboard-wide">
            <input
              type="checkbox"
              checked={value.hasPriorAssessment}
              disabled={value.priceMode === "ASSESSMENT_REQUIRED"}
              onChange={(e) =>
                setValue((d) => ({
                  ...d,
                  hasPriorAssessment: e.target.checked,
                  assessmentDescription: e.target.checked
                    ? (d.assessmentDescription ?? "")
                    : null,
                }))
              }
            />
            Requiere valoración previa
          </label>
        )}
        {value.hasPriorAssessment && (
          <label className="onboard-wide">
            Cómo funciona la valoración
            <textarea
              required
              maxLength={1000}
              value={value.assessmentDescription ?? ""}
              onChange={(e) => change("assessmentDescription", e.target.value)}
            />
          </label>
        )}
        <label className="onboard-check">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Servicio activo
        </label>
      </div>
      {saveButton(busy, "Guardar servicio")}
    </form>
  );
}
export function TeamStep({
  snapshot,
  busy,
  save,
  confirmDiscard = () => true,
}: Props) {
  const cfg = snapshot.configuration!;
  const [kind, setKind] = useState<"people" | "resources">("people"),
    [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState(false);
  const person =
      kind === "people"
        ? cfg.professionals.find((p) => p.id === selected)
        : undefined,
    resource =
      kind === "resources"
        ? cfg.resources.find((r) => r.id === selected)
        : undefined;
  return (
    <>
      <div className="onboard-switch" aria-label="Configuración del equipo">
        <button
          type="button"
          aria-pressed={kind === "people"}
          onClick={() => {
            if (!confirmDiscard()) return;
            setKind("people");
            setSelected(null);
            setCreating(false);
          }}
        >
          Personas que atienden
        </button>
        <button
          type="button"
          aria-pressed={kind === "resources"}
          onClick={() => {
            if (!confirmDiscard()) return;
            setKind("resources");
            setSelected(null);
            setCreating(false);
          }}
        >
          Espacios y equipos · opcional
        </button>
      </div>
      <p>
        {kind === "people"
          ? "Un profesional presta servicios. Esto no crea una cuenta de usuario ni envía una invitación."
          : "Añade solo lo que necesitas para atender: una silla, una cabina, una sala o un equipo. Si no los utilizas, puedes continuar sin añadirlos."}
      </p>
      <ul className="onboard-record-list">
        {(kind === "people" ? cfg.professionals : cfg.resources).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="onboard-record-button"
              onClick={() => {
                if (!confirmDiscard()) return;
                setSelected(item.id);
                setCreating(false);
              }}
            >
              <strong>
                {"displayName" in item ? item.displayName : item.name}
              </strong>
              <span>
                {"capacity" in item
                  ? `Capacidad: ${item.capacity}`
                  : `${item.serviceIds.length} servicios · ${item.branchIds.length} sucursales`}
              </span>
              <span>Editar ↗</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="onboard-secondary"
        disabled={
          busy ||
          (kind === "people" &&
            cfg.professionals.length >=
              (snapshot.entitlement?.limits.professionals ?? 0))
        }
        onClick={() => {
          if (!confirmDiscard()) return;
          setSelected(null);
          setCreating(true);
        }}
      >
        {kind === "people" ? "Añadir profesional" : "Añadir espacio o equipo"}
      </button>
      {kind === "people" &&
        (creating || person || !cfg.professionals.length) && (
          <ProfessionalForm
            key={(person?.id ?? "new") + ":" + (person?.version ?? 0)}
            initial={person}
            snapshot={snapshot}
            busy={busy}
            save={async (path, data) => {
              const ok = await save(path, data);
              if (ok) {
                setCreating(false);
                setSelected(null);
              }
              return ok;
            }}
          />
        )}
      {kind === "people" &&
        person &&
        person.branchIds.map((id) => {
          const branch = cfg.branches.find((b) => b.id === id);
          return (
            branch && (
              <details className="onboard-individual-hours" key={id}>
                <summary>
                  Horario individual de {person.displayName} en {branch.name}
                </summary>
                <p>
                  Opcional. Configura una semana propia si difiere del horario
                  del local.
                </p>
                <ScheduleForm
                  key={
                    person.id +
                    ":" +
                    id +
                    ":" +
                    (cfg.schedules.find(
                      (s) =>
                        s.branchId === id && s.professionalId === person.id,
                    )?.version ?? "new")
                  }
                  branch={branch}
                  professionalId={person.id}
                  schedules={cfg.schedules}
                  busy={busy}
                  save={save}
                />
              </details>
            )
          );
        })}
      {kind === "resources" && (creating || resource) && (
        <ResourceForm
          key={(resource?.id ?? "new") + ":" + (resource?.version ?? 0)}
          initial={resource}
          snapshot={snapshot}
          busy={busy}
          save={async (path, data) => {
            const ok = await save(path, data);
            if (ok) {
              setCreating(false);
              setSelected(null);
            }
            return ok;
          }}
        />
      )}
      <p className="onboard-note">
        Autorización {snapshot.entitlement?.plan}: hasta{" "}
        {snapshot.entitlement?.limits.professionals} profesionales y{" "}
        {snapshot.entitlement?.limits.branches} sucursal(es) registrados. No se
        crean usuarios del panel al añadir profesionales.
      </p>
    </>
  );
}
function Choices({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Array<{ id: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset className="onboard-choices">
      <legend>{label}</legend>
      {items.map((item) => (
        <label className="onboard-check" key={item.id}>
          <input
            type="checkbox"
            checked={value.includes(item.id)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, item.id]
                  : value.filter((id) => id !== item.id),
              )
            }
          />
          {item.label}
        </label>
      ))}
    </fieldset>
  );
}
function ProfessionalForm({
  initial,
  snapshot,
  busy,
  save,
}: Props & { initial?: Professional }) {
  const cfg = snapshot.configuration!;
  const [name, setName] = useState(initial?.displayName ?? ""),
    [specialty, setSpecialty] = useState(initial?.specialty ?? ""),
    [branches, setBranches] = useState(initial?.branchIds ?? []),
    [services, setServices] = useState(initial?.serviceIds ?? []);
  return (
    <form
      className="onboard-subform"
      onSubmit={(e) => {
        e.preventDefault();
        void save("professionals", {
          data: {
            displayName: name,
            specialty: specialty || null,
            branchIds: branches,
            serviceIds: services,
          },
          ...(initial
            ? { id: initial.id, entityVersion: initial.version }
            : {}),
        });
      }}
    >
      <h2>{initial ? "Editar profesional" : "Alguien de tu equipo"}</h2>
      <div className="onboard-fields">
        <label>
          Nombre del profesional
          <input
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Especialidad <span>Opcional</span>
          <input
            maxLength={500}
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </label>
      </div>
      <Choices
        label="Dónde atiende"
        items={cfg.branches
          .filter((b) => b.active)
          .map((b) => ({ id: b.id, label: b.name }))}
        value={branches}
        onChange={setBranches}
      />
      <Choices
        label="Qué servicios presta"
        items={cfg.services
          .filter((s) => s.active)
          .map((s) => ({ id: s.id, label: s.name }))}
        value={services}
        onChange={setServices}
      />
      {saveButton(busy, "Guardar profesional")}
    </form>
  );
}
function ResourceForm({
  initial,
  snapshot,
  busy,
  save,
}: Props & { initial?: Resource }) {
  const cfg = snapshot.configuration!;
  const [name, setName] = useState(initial?.name ?? ""),
    [description, setDescription] = useState(initial?.typeDescription ?? ""),
    [capacity, setCapacity] = useState(initial?.capacity ?? 1),
    [branchId, setBranchId] = useState(initial?.branchId ?? "");
  return (
    <form
      className="onboard-subform"
      onSubmit={(e) => {
        e.preventDefault();
        void save("resources", {
          data: {
            name,
            typeDescription: description || null,
            capacity,
            branchId,
          },
          ...(initial
            ? { id: initial.id, entityVersion: initial.version }
            : {}),
        });
      }}
    >
      <h2>{initial ? "Editar espacio o equipo" : "Con qué atiendes"}</h2>
      <div className="onboard-fields">
        <label>
          Nombre
          <input
            required
            maxLength={120}
            placeholder="Por ejemplo: silla de barbería 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Qué es <span>Opcional</span>
          <input
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          Sucursal
          <select
            required
            disabled={!!initial}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">Elige dónde está</option>
            {cfg.branches
              .filter((b) => b.active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Capacidad simultánea
          <input
            required
            type="number"
            min={1}
            max={2147483647}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="onboard-muted">
        Una silla individual tiene capacidad 1. Este dato configura el espacio;
        no habilita reservas todavía.
      </p>
      {saveButton(busy, "Guardar espacio o equipo")}
    </form>
  );
}
export function ReviewStep({ snapshot }: { snapshot: OnboardingSnapshot }) {
  const cfg = snapshot.configuration!;
  const values: Array<[string, ReactNode]> = [
    ["Sector", "Belleza y bienestar"],
    ["Negocio", cfg.business.commercialName],
    [
      "Ubicación",
      [
        COUNTRIES.find(([code]) => code === cfg.business.countryCode)?.[1],
        cfg.business.city,
        cfg.business.address,
      ]
        .filter(Boolean)
        .join(" · ") || "Sin dirección física registrada",
    ],
    [
      "Sucursal",
      cfg.branches
        .filter((b) => b.active)
        .map((b) => b.name)
        .join(", "),
    ],
    [
      "Horarios",
      cfg.schedules
        .filter((s) => !s.professionalId)
        .map((s) => (
          <div key={s.id}>
            <strong>
              {cfg.branches.find((b) => b.id === s.branchId)?.name}
            </strong>
            <span> · {s.timeZone}</span>
            <ul>
              {s.week
                .filter((d) => !d.closed)
                .map((day) => (
                  <li key={day.weekday}>
                    {DAY_NAMES[day.weekday - 1]} ·{" "}
                    {day.intervals
                      .map((i) => `${i.start}–${i.end}`)
                      .join(" / ")}
                  </li>
                ))}
            </ul>
          </div>
        )),
    ],
    [
      "Servicios",
      cfg.services
        .filter((s) => s.active)
        .map((s) => `${s.name} · ${s.durationMinutes} min · ${priceLabel(s)}`)
        .join(", "),
    ],
    [
      "Profesionales",
      cfg.professionals
        .filter((p) => p.active)
        .map((p) => p.displayName)
        .join(", "),
    ],
    [
      "Espacios y equipos",
      cfg.resources.length
        ? cfg.resources
            .map((r) => `${r.name} · capacidad ${r.capacity}`)
            .join(", ")
        : "No utilizo recursos físicos adicionales",
    ],
    [
      "Autorización",
      snapshot.entitlement?.kind === "MANUAL_PILOT"
        ? `Acceso gratuito ${snapshot.entitlement.plan} · sin pago registrado`
        : `Suscripción con evidencia externa · ${snapshot.entitlement?.plan}`,
    ],
  ];
  return (
    <>
      <dl className="onboard-review">
        {values.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Pendiente"}</dd>
          </div>
        ))}
      </dl>
      {snapshot.entitlement?.expiresAt && (
        <p className="onboard-note">
          El acceso gratuito vence el{" "}
          {new Intl.DateTimeFormat("es-EC", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(snapshot.entitlement.expiresAt))}
          . No se renueva automáticamente.
        </p>
      )}
      {snapshot.missing.length > 0 && (
        <section
          className="onboard-pending"
          aria-label="Configuración pendiente"
        >
          <h2>Falta un poco para entrar</h2>
          <ul>
            {snapshot.missing.map((item) => (
              <li key={item.step}>{item.message}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="onboard-note">
        Al terminar podrás editar tu negocio, catálogo y equipo. El motor de
        reservas y el asistente IA todavía no están disponibles.
      </p>
    </>
  );
}
