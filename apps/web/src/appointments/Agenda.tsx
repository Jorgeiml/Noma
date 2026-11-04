import { useEffect, useRef, useState, type ReactNode } from "react";
import { ProductNavigation, type ProductArea } from "../ProductNavigation";
import { ContextualNomi, usePersonality } from "../identity/Identity";
import { BookingForm } from "./BookingForm";
import {
  appointmentsApi,
  stateLabels,
  localDate,
  timeLabel,
  dayPlus,
  type Configuration,
  type Agenda as AgendaData,
  type Appointment,
  type AppointmentState,
} from "./appointments-api";
import "./agenda.css";
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (d.showModal) d.showModal();
    else d.setAttribute("open", "");
    return () => d.close?.();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`agenda-dialog ${wide ? "agenda-dialog-wide" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <p className="agenda-overline">NOMA · AGENDA</p>
          <h2>{title}</h2>
        </div>
        <button
          type="button"
          className="agenda-close"
          aria-label="Cerrar panel"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
export default function Agenda({
  timeZone,
  onNavigate,
  enabledAreas,
  onEditingChange,
}: {
  timeZone: string;
  onNavigate: (area: ProductArea) => void;
  enabledAreas: ProductArea[];
  onEditingChange: (s: { busy: boolean; dirty: boolean }) => void;
}) {
  const identity = usePersonality();
  const [configuration, setConfiguration] = useState<Configuration | null>(
      null,
    ),
    [data, setData] = useState<AgendaData | null>(null),
    [date, updateDate] = useState(() => localDate(new Date(), timeZone)),
    [days, updateDays] = useState(1),
    [branch, updateBranch] = useState(""),
    [professional, updateProfessional] = useState(""),
    [page, updatePage] = useState(1),
    [revision, updateRevision] = useState(0),
    [now, setNow] = useState(() => Date.now()),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [booking, setBooking] = useState(false),
    [discard, setDiscard] = useState(false),
    [original, setOriginal] = useState<Appointment | null>(null),
    [detail, setDetail] = useState<Appointment | null>(null),
    [detailLoading, setDetailLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState(""),
    [mobileDate, setMobileDate] = useState(date);
  const mutation = useRef<{ fingerprint: string; id: string } | null>(null),
    flight = useRef(false),
    today = localDate(new Date(now), data?.timeZone ?? timeZone);
  function loadingFilters() {
    setLoading(true);
    setError("");
    updatePage(1);
  }
  function setDate(value: string) {
    loadingFilters();
    updateDate(value);
    setMobileDate(value);
  }
  function setDays(value: number) {
    loadingFilters();
    updateDays(value);
    setMobileDate(date);
  }
  function setBranch(value: string) {
    loadingFilters();
    updateBranch(value);
  }
  function setProfessional(value: string) {
    loadingFilters();
    updateProfessional(value);
  }
  function setPage(value: (p: number) => number) {
    setLoading(true);
    updatePage(value);
  }
  function setRevision(value: (n: number) => number) {
    setLoading(true);
    setError("");
    updateRevision(value);
  }
  useEffect(() => {
    let live = true;
    void appointmentsApi
      .configuration()
      .then((c) => {
        if (live) {
          setConfiguration(c);
          updateBranch(c.branches[0]?.id ?? "");
        }
      })
      .catch((e) => {
        if (live) setError((e as Error).message);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!configuration) return;
    let live = true;
    void appointmentsApi
      .agenda({
        date,
        days,
        branchId: branch,
        professionalId: professional,
        page,
      })
      .then((d) => {
        if (live) {
          setData(d);
          setNow(Date.now());
        }
      })
      .catch((e) => {
        if (live) setError((e as Error).message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [date, days, branch, professional, page, revision, configuration]);
  useEffect(() => {
    onEditingChange({ busy, dirty: booking });
    return () => onEditingChange({ busy: false, dirty: false });
  }, [booking, busy, onEditingChange]);
  async function openDetail(a: Appointment) {
    setDetail(a);
    setDetailLoading(true);
    setError("");
    setReason("");
    try {
      setDetail(await appointmentsApi.detail(a.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }
  async function changeState(state: AppointmentState) {
    if (!detail || flight.current) return;
    const payload = { version: detail.version, state, reason: reason || null };
    const fingerprint = JSON.stringify({ id: detail.id, ...payload });
    if (mutation.current?.fingerprint !== fingerprint)
      mutation.current = { fingerprint, id: crypto.randomUUID() };
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      const a = await appointmentsApi.state(detail.id, {
        ...payload,
        requestId: mutation.current.id,
      });
      setDetail(await appointmentsApi.detail(a.id));
      setNotice(`Cita ${stateLabels[state].toLowerCase()}.`);
      setRevision((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  function closeBooking() {
    if (busy) return;
    setDiscard(true);
  }
  const dayList = Array.from({ length: days }, (_, i) => dayPlus(date, i));
  function row(a: Appointment) {
    return (
      <button
        className={`agenda-appointment state-${a.state.toLowerCase()}`}
        key={a.id}
        onClick={() => void openDetail(a)}
        aria-label={`${timeLabel(a.startsAt, data!.timeZone)} · ${a.customer.name} · ${a.snapshot.serviceName} · ${stateLabels[a.state]}`}
      >
        <span className="agenda-appointment-time">
          <strong>{timeLabel(a.startsAt, data!.timeZone)}</strong>
          <small>
            hasta {timeLabel(a.endsAt, data!.timeZone)}
            {localDate(a.endsAt, data!.timeZone) !==
            localDate(a.startsAt, data!.timeZone)
              ? ` · ${localDate(a.endsAt, data!.timeZone)}`
              : ""}
          </small>
        </span>
        <span className="agenda-appointment-person">
          <strong>{a.customer.name}</strong>
          <span>{a.snapshot.serviceName}</span>
          <small>
            {a.snapshot.professionalName ?? "Espacio o equipo"} ·{" "}
            {a.durationMinutes} min
          </small>
        </span>
        <span className="agenda-status">{stateLabels[a.state]}</span>
      </button>
    );
  }
  return (
    <>
      <ProductNavigation
        active="agenda"
        onSelect={onNavigate}
        enabledAreas={enabledAreas}
      />
      <section className="agenda-main" aria-label="Agenda de citas">
        <header className="agenda-heading">
          <div>
            <p className="agenda-overline">TU OPERACIÓN, A SU RITMO</p>
            <h1>Agenda</h1>
            <p>Un lugar para cada cita. {data?.timeZone ?? timeZone}</p>
          </div>
          <button
            className="agenda-primary"
            disabled={
              !configuration?.branches.length || !configuration.services.length
            }
            onClick={() => {
              setOriginal(null);
              setBooking(true);
            }}
          >
            ＋ Nueva cita
          </button>
        </header>
        <div className="agenda-toolbar">
          <div className="agenda-date-navigation">
            <button
              aria-label="Fecha anterior"
              onClick={() => setDate(dayPlus(date, -days))}
            >
              ←
            </button>
            <button onClick={() => setDate(today)}>Hoy</button>
            <button
              aria-label="Fecha siguiente"
              onClick={() => setDate(dayPlus(date, days))}
            >
              →
            </button>
            <label>
              Fecha de agenda
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
              />
            </label>
          </div>
          <div className="agenda-segment" aria-label="Vista de agenda">
            <button aria-pressed={days === 1} onClick={() => setDays(1)}>
              Día
            </button>
            <button aria-pressed={days === 7} onClick={() => setDays(7)}>
              Semana
            </button>
          </div>
          <button
            className="agenda-secondary"
            onClick={() => setRevision((n) => n + 1)}
            disabled={loading}
          >
            Actualizar agenda
          </button>
        </div>
        <div className="agenda-filters">
          <label>
            Sucursal de agenda
            <select
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setProfessional("");
              }}
            >
              <option value="">Todas las sucursales</option>
              {configuration?.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Profesional de agenda
            <select
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
            >
              <option value="">Todo el equipo</option>
              {configuration?.professionals
                .filter(
                  (p) =>
                    !branch || p.branches.some((b) => b.branchId === branch),
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
            </select>
          </label>
          <small>
            Se actualiza al consultar o guardar. No es una transmisión en vivo.
          </small>
        </div>
        {notice && (
          <p className="agenda-success" role="status">
            {notice}
          </p>
        )}
        {error && !booking && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="agenda-loading" role="status">
            Preparando tu agenda…
          </p>
        ) : (
          data && (
            <>
              {days === 7 && (
                <div
                  className="agenda-mobile-days"
                  aria-label="Día de la semana"
                >
                  {dayList.map((d) => (
                    <button
                      key={d}
                      aria-pressed={mobileDate === d}
                      onClick={() => setMobileDate(d)}
                    >
                      {new Intl.DateTimeFormat("es-EC", {
                        weekday: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(d + "T12:00:00Z"))}
                    </button>
                  ))}
                </div>
              )}
              {!data.items.length ? (
                <div className="agenda-empty">
                  <ContextualNomi />
                  <p>{identity.empty}</p>
                  <h2>Hay espacio para tu próxima cita.</h2>
                  <p>
                    {!configuration?.branches.length ||
                    !configuration.services.length
                      ? "Configura sucursal, servicio, equipo y horarios antes de reservar."
                      : "Elige Nueva cita y buscaremos una hora que funcione para el servicio, el equipo y los espacios necesarios."}
                  </p>
                  <button
                    className="agenda-secondary"
                    onClick={() => onNavigate("operations")}
                  >
                    Revisar equipo y horarios
                  </button>
                </div>
              ) : (
                <div
                  className={`agenda-days ${days === 7 ? "agenda-week" : ""}`}
                >
                  {dayList.map((d) => (
                    <section
                      key={d}
                      className={`agenda-day ${mobileDate === d ? "agenda-mobile-selected" : ""}`}
                      aria-label={`Citas del ${d}`}
                    >
                      <header>
                        <h2>
                          {new Intl.DateTimeFormat("es-EC", {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                            timeZone: "UTC",
                          }).format(new Date(d + "T12:00:00Z"))}
                        </h2>
                      </header>
                      <div className="agenda-day-appointments">
                        {data.items
                          .filter(
                            (a) =>
                              localDate(a.startsAt, data.timeZone) <= d &&
                              localDate(a.endsAt, data.timeZone) >= d,
                          )
                          .map(row)}
                        {!data.items.some(
                          (a) =>
                            localDate(a.startsAt, data.timeZone) <= d &&
                            localDate(a.endsAt, data.timeZone) >= d,
                        ) && (
                          <p className="agenda-day-empty">
                            Sin citas en esta página.
                          </p>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              )}
              {data.total > data.pageSize && (
                <nav
                  className="agenda-pagination"
                  aria-label="Páginas de agenda"
                >
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {page} · {data.total} citas
                  </span>
                  <button
                    disabled={page * data.pageSize >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </button>
                </nav>
              )}
            </>
          )
        )}
        {detail && !booking && (
          <Modal
            title="Detalle de la cita"
            onClose={() => {
              if (!busy) setDetail(null);
            }}
          >
            {detailLoading ? (
              <p role="status">Cargando detalle…</p>
            ) : (
              <div className="agenda-detail">
                <span
                  className={`agenda-status state-${detail.state.toLowerCase()}`}
                >
                  {stateLabels[detail.state]}
                </span>
                <h3>{detail.customer.name}</h3>
                <p>
                  {detail.customer.phone ?? "Sin teléfono"}
                  {detail.customer.email ? ` · ${detail.customer.email}` : ""}
                </p>
                <dl>
                  <dt>Servicio</dt>
                  <dd>
                    {detail.snapshot.serviceName} · {detail.durationMinutes} min
                  </dd>
                  <dt>Horario</dt>
                  <dd>
                    {localDate(detail.startsAt, detail.timeZone)} ·{" "}
                    {timeLabel(detail.startsAt, detail.timeZone)} →{" "}
                    {timeLabel(detail.endsAt, detail.timeZone)}
                  </dd>
                  <dt>Sucursal y profesional</dt>
                  <dd>
                    {detail.snapshot.branchName} ·{" "}
                    {detail.snapshot.professionalName ??
                      "Solo espacio o equipo"}
                  </dd>
                  <dt>Origen</dt>
                  <dd>
                    {
                      {
                        PHONE: "Por teléfono",
                        IN_PERSON: "En persona",
                        INTERNAL: "Registro interno",
                      }[detail.channel]
                    }
                  </dd>
                  <dt>Precio al reservar</dt>
                  <dd>
                    {detail.snapshot.priceMode === "ASSESSMENT_REQUIRED"
                      ? "Sujeto a valoración"
                      : `${detail.snapshot.priceMode === "FROM" ? "Desde " : ""}${detail.snapshot.priceMin ?? "—"}${detail.snapshot.priceMax ? ` – ${detail.snapshot.priceMax}` : ""} ${detail.snapshot.currency}`}{" "}
                    · no representa un pago
                  </dd>
                </dl>
                {detail.note && <p className="agenda-note">{detail.note}</p>}
                <div className="agenda-detail-actions">
                  {["CONFIRMED", "PENDING_CONFIRMATION"].includes(
                    detail.state,
                  ) && (
                    <>
                      <button
                        className="agenda-primary"
                        disabled={busy}
                        onClick={() => {
                          setOriginal(detail);
                          setBooking(true);
                        }}
                      >
                        Reagendar
                      </button>
                      <label>
                        Motivo de cancelación
                        <input
                          maxLength={500}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                      <button
                        className="agenda-danger"
                        disabled={busy || !reason.trim()}
                        onClick={() => void changeState("CANCELLED")}
                      >
                        Cancelar cita
                      </button>
                    </>
                  )}
                  {detail.state === "PENDING_CONFIRMATION" && (
                    <button
                      className="agenda-secondary"
                      disabled={busy}
                      onClick={() => void changeState("CONFIRMED")}
                    >
                      Confirmar cita
                    </button>
                  )}
                  {detail.state === "CONFIRMED" && (
                    <>
                      <button
                        className="agenda-secondary"
                        disabled={
                          busy ||
                          Date.parse(detail.endsAt) >
                            (detail.serverNow
                              ? Date.parse(detail.serverNow)
                              : now)
                        }
                        onClick={() => void changeState("COMPLETED")}
                      >
                        Marcar completada
                      </button>
                      <button
                        className="agenda-secondary"
                        disabled={
                          busy ||
                          Date.parse(detail.startsAt) >
                            (detail.serverNow
                              ? Date.parse(detail.serverNow)
                              : now)
                        }
                        onClick={() => void changeState("NO_SHOW")}
                      >
                        Marcar no asistió
                      </button>
                      <small>
                        Los estados de atención se habilitan cuando llega la
                        hora correspondiente.
                      </small>
                    </>
                  )}
                </div>
                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}
                <h4>Historial de la cita</h4>
                <ol className="agenda-history">
                  {detail.events?.map((e) => (
                    <li key={e.id}>
                      <strong>
                        {{
                          CREATED: "Creada",
                          RESCHEDULED: "Reagendada",
                          ...stateLabels,
                        }[e.type] ?? e.type}
                      </strong>
                      <span>
                        {new Intl.DateTimeFormat("es-EC", {
                          timeZone: detail.timeZone,
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(e.createdAt))}
                      </span>
                      {e.reason && <p>{e.reason}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Modal>
        )}
        {booking && configuration && (
          <Modal
            title={original ? "Cambiar el horario" : "Una nueva cita"}
            onClose={closeBooking}
            wide
          >
            {discard && (
              <div className="agenda-discard" role="alert">
                <strong>¿Cerrar sin guardar?</strong>
                <p>
                  Conserva el formulario para seguir editando o descarta estos
                  cambios.
                </p>
                <button type="button" onClick={() => setDiscard(false)}>
                  Seguir editando
                </button>
                <button
                  type="button"
                  className="agenda-danger"
                  onClick={() => {
                    setDiscard(false);
                    setBooking(false);
                  }}
                >
                  Descartar y cerrar
                </button>
              </div>
            )}
            <BookingForm
              configuration={configuration}
              branchId={branch}
              professionalId={professional}
              date={date}
              original={original}
              onDone={(a) => {
                setBooking(false);
                setDetail(null);
                setDate(localDate(a.startsAt, a.timeZone));
                setNotice(
                  original
                    ? "Horario actualizado. La cita conserva su identidad."
                    : "Cita creada. Lista para confirmar.",
                );
                setRevision((n) => n + 1);
              }}
              onBusy={setBusy}
            />
          </Modal>
        )}
      </section>
    </>
  );
}
