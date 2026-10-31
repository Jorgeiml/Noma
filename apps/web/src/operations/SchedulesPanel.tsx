import { useState } from "react";
import {
  staffApi,
  type Interval,
  type WeekDay,
  type Schedule,
  type ExceptionDraft,
  type ScheduleException,
} from "../api/staff";
import type { EditorProps } from "./EntityEditors";
const days = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
type Props = EditorProps & {
  revision: number;
  choose: (action: () => void) => void;
  onDirty: () => void;
};
export function Intervals({
  value,
  onChange,
  label,
}: {
  value: Interval[];
  onChange: (value: Interval[]) => void;
  label: string;
}) {
  return (
    <div className="intervals">
      {value.map((interval, i) => (
        <div className="interval-row" key={i}>
          <label>
            {label} · inicio {i + 1}
            <input
              type="time"
              required
              value={interval.start}
              onChange={(e) =>
                onChange(
                  value.map((v, n) =>
                    n === i ? { ...v, start: e.target.value } : v,
                  ),
                )
              }
            />
          </label>
          <span aria-hidden="true">—</span>
          <label>
            {label} · fin {i + 1}
            <input
              type="time"
              required
              value={interval.end}
              onChange={(e) =>
                onChange(
                  value.map((v, n) =>
                    n === i ? { ...v, end: e.target.value } : v,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            className="text-button"
            aria-label={`Quitar intervalo ${i + 1} de ${label}`}
            onClick={() => onChange(value.filter((_, n) => n !== i))}
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-button"
        disabled={value.length >= 24}
        onClick={() => onChange([...value, { start: "", end: "" }])}
      >
        Añadir intervalo · {label}
      </button>
    </div>
  );
}
export function SchedulesPanel(props: Props) {
  const [branchId, setBranch] = useState(""),
    [professionalId, setProfessional] = useState(""),
    [exceptionId, setException] = useState<string | null>(null);
  const [mode, setMode] = useState<"week" | "exceptions">("week");
  const branch = props.cfg.branches.find((b) => b.id === branchId);
  const schedule = props.cfg.schedules.find(
    (s) =>
      s.branchId === branchId && s.professionalId === (professionalId || null),
  );
  const assigned = props.cfg.professionals.filter(
    (p) => p.branchIds.includes(branchId) || p.id === professionalId,
  );
  return (
    <section className="schedules-panel">
      <h2>Horarios locales, con contexto.</h2>
      <p>
        Una configuración por sucursal, y otra por profesional en esa sucursal
        cuando corresponda. No se combinan ni se infiere disponibilidad.
      </p>
      <fieldset disabled={props.busy} className="form-pair">
        <div>
          <label htmlFor="schedule-branch">Sucursal del horario</label>
          <select
            id="schedule-branch"
            value={branchId}
            onChange={(e) =>
              props.choose(() => {
                setBranch(e.target.value);
                setProfessional("");
                setException(null);
              })
            }
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
          <label htmlFor="schedule-professional">Horario de</label>
          <select
            id="schedule-professional"
            disabled={!branchId}
            value={professionalId}
            onChange={(e) =>
              props.choose(() => {
                setProfessional(e.target.value);
                setException(null);
              })
            }
          >
            <option value="">Sucursal completa</option>
            {assigned.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
                {!p.active ? " · Inactivo" : ""}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      {branch && (
        <>
          <p className="schedule-context">
            <strong>{branch.name}</strong> · {branch.timeZone} ·{" "}
            {professionalId
              ? assigned.find((p) => p.id === professionalId)?.displayName
              : "Horario de la sucursal"}
          </p>
          {!branch.active && (
            <p>
              La sucursal está inactiva. Puedes consultar su configuración;
              actívala para guardar horarios.
            </p>
          )}
          <div className="save-row">
            <button
              type="button"
              disabled={props.busy}
              onClick={() => props.choose(() => setMode("week"))}
              aria-pressed={mode === "week"}
            >
              Semana habitual
            </button>
            <button
              type="button"
              disabled={props.busy || !schedule}
              onClick={() => props.choose(() => setMode("exceptions"))}
              aria-pressed={mode === "exceptions"}
            >
              Excepciones por fecha
            </button>
          </div>
          {mode === "week" && (
            <WeekEditor
              key={`${branchId}-${professionalId}-${schedule?.version}-${props.revision}`}
              {...props}
              schedule={schedule}
              branchId={branchId}
              professionalId={professionalId || null}
              timeZone={schedule?.timeZone ?? branch.timeZone}
              disabled={!branch.active}
            />
          )}
          {schedule && mode === "exceptions" ? (
            <section className="exceptions-panel">
              <h3>Excepciones por fecha</h3>
              <p>Fechas locales de este horario en {schedule.timeZone}.</p>
              <button
                type="button"
                disabled={props.busy}
                onClick={() => props.choose(() => setException(null))}
              >
                Nueva excepción
              </button>
              <ul className="operations-list">
                {props.cfg.exceptions
                  .filter((e) => e.scheduleId === schedule.id)
                  .map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        disabled={props.busy}
                        aria-pressed={exceptionId === e.id}
                        onClick={() => props.choose(() => setException(e.id))}
                      >
                        {e.date} ·{" "}
                        {e.kind === "ABSENCE"
                          ? "Ausencia"
                          : e.kind === "CLOSURE"
                            ? "Cierre"
                            : "Horario modificado"}{" "}
                        · {e.active ? "Activa" : "Inactiva"}
                      </button>
                    </li>
                  ))}
              </ul>
              <ExceptionEditor
                key={`${schedule.id}-${exceptionId}-${props.revision}`}
                {...props}
                schedule={schedule}
                initial={props.cfg.exceptions.find((e) => e.id === exceptionId)}
                disabled={!branch.active}
              />
            </section>
          ) : !schedule ? (
            <p>
              Guarda primero el horario para registrar excepciones. Ningún día
              sin configurar se interpreta como abierto.
            </p>
          ) : null}
        </>
      )}
      {!props.cfg.branches.length && (
        <p>Crea tu primera sucursal para configurar horarios.</p>
      )}
    </section>
  );
}
function WeekEditor({
  schedule,
  branchId,
  professionalId,
  timeZone,
  busy,
  perform,
  onDirty,
  disabled,
}: Props & {
  schedule?: Schedule;
  branchId: string;
  professionalId: string | null;
  timeZone: string;
  disabled: boolean;
}) {
  const [week, setWeek] = useState<WeekDay[]>(schedule?.week ?? []);
  function dayChange(weekday: number, day: WeekDay | null) {
    setWeek((previous) =>
      [
        ...previous.filter((d) => d.weekday !== weekday),
        ...(day ? [day] : []),
      ].sort((a, b) => a.weekday - b.weekday),
    );
    onDirty();
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void perform(() =>
          staffApi.schedule({
            branchId,
            professionalId,
            timeZone,
            week,
            version: schedule?.version ?? null,
          }),
        );
      }}
    >
      <fieldset disabled={busy || disabled}>
        <legend>Semana habitual</legend>
        <p className="field-help">
          Cada intervalo empieza y termina el mismo día. Añade otro intervalo
          para representar una pausa. Los días omitidos siguen sin configurar.
        </p>
        <div className="week-grid">
          {days.map((name, index) => {
            const weekday = index + 1,
              day = week.find((d) => d.weekday === weekday);
            return (
              <div
                key={weekday}
                className="week-day"
                data-day-state={!day ? "unset" : day.closed ? "closed" : "open"}
              >
                <div>
                  <label htmlFor={`day-${weekday}`}>{name}</label>
                  <select
                    id={`day-${weekday}`}
                    value={!day ? "unset" : day.closed ? "closed" : "open"}
                    onChange={(e) =>
                      dayChange(
                        weekday,
                        e.target.value === "unset"
                          ? null
                          : {
                              weekday,
                              closed: e.target.value === "closed",
                              intervals:
                                e.target.value === "open"
                                  ? [{ start: "", end: "" }]
                                  : [],
                            },
                      )
                    }
                  >
                    <option value="unset">Sin configurar</option>
                    <option value="closed">Cerrado</option>
                    <option value="open">Con intervalos</option>
                  </select>
                </div>
                {day && !day.closed && (
                  <Intervals
                    label={name}
                    value={day.intervals}
                    onChange={(intervals) =>
                      dayChange(weekday, { ...day, intervals })
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
        <button disabled={busy || disabled}>Guardar horario semanal</button>
      </fieldset>
    </form>
  );
}
function ExceptionEditor({
  schedule,
  initial,
  busy,
  perform,
  onDirty,
  disabled,
}: Props & {
  schedule: Schedule;
  initial?: ScheduleException;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState<ExceptionDraft>(
    initial
      ? {
          date: initial.date,
          kind: initial.kind,
          intervals: initial.intervals,
          note: initial.note,
        }
      : { date: "", kind: "CLOSURE", intervals: [], note: null },
  );
  const [changed, setChanged] = useState(false);
  function change(value: ExceptionDraft) {
    setDraft(value);
    setChanged(true);
    onDirty();
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void perform(() =>
          staffApi.exception(schedule.id, draft, initial?.id, initial?.version),
        );
      }}
    >
      <fieldset disabled={busy || disabled}>
        <legend>
          {initial ? "Editar excepción" : "Nueva excepción por fecha"}
        </legend>
        <div className="form-pair">
          <div>
            <label htmlFor="exception-date">Fecha de excepción</label>
            <input
              id="exception-date"
              required
              type="date"
              min="1000-01-01"
              max="9999-12-31"
              value={draft.date}
              onChange={(e) => change({ ...draft, date: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="exception-kind">Tipo de excepción</label>
            <select
              id="exception-kind"
              value={draft.kind}
              onChange={(e) =>
                change({
                  ...draft,
                  kind: e.target.value as ExceptionDraft["kind"],
                  intervals:
                    e.target.value === "MODIFIED"
                      ? [{ start: "", end: "" }]
                      : [],
                })
              }
            >
              <option value="CLOSURE">Cierre</option>
              <option value="ABSENCE">Ausencia</option>
              <option value="MODIFIED">Horario modificado</option>
            </select>
          </div>
        </div>
        {draft.kind === "MODIFIED" && (
          <Intervals
            value={draft.intervals}
            label="Excepción"
            onChange={(intervals) => change({ ...draft, intervals })}
          />
        )}
        <label htmlFor="exception-note">Motivo (opcional)</label>
        <textarea
          id="exception-note"
          maxLength={1000}
          value={draft.note ?? ""}
          onChange={(e) => change({ ...draft, note: e.target.value || null })}
        />
        <div className="save-row">
          <button disabled={busy || disabled}>Guardar excepción</button>
          {initial && (
            <button
              type="button"
              className="text-button"
              disabled={busy || changed}
              onClick={() =>
                void perform(() =>
                  staffApi.status(
                    "exceptions",
                    initial.id,
                    !initial.active,
                    initial.version,
                  ),
                )
              }
            >
              {initial.active ? "Desactivar excepción" : "Reactivar excepción"}
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
