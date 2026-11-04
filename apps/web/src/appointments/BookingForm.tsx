import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  appointmentsApi,
  localDate,
  type Appointment,
  type Configuration,
  type Customer,
  type Availability,
  type Slot,
} from "./appointments-api";
export function BookingForm({
  configuration,
  branchId,
  professionalId,
  date,
  original,
  onDone,
  onBusy,
}: {
  configuration: Configuration;
  branchId: string;
  professionalId: string;
  date: string;
  original: Appointment | null;
  onDone: (a: Appointment) => void;
  onBusy?: (value: boolean) => void;
}) {
  const [branch, setBranch] = useState(original?.branchId ?? branchId),
    [service, setService] = useState(original?.serviceId ?? ""),
    [professional, setProfessional] = useState(
      original?.professionalId ?? professionalId,
    ),
    [day, setDay] = useState(
      original ? localDate(original.startsAt, original.timeZone) : date,
    ),
    [step, setStep] = useState("15");
  const [availability, setAvailability] = useState<Availability | null>(null),
    [slot, setSlot] = useState<Slot | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [searching, setSearching] = useState(false);
  const [newCustomer, setNewCustomer] = useState(false),
    [q, setQ] = useState(""),
    [customers, setCustomers] = useState<Customer[]>([]),
    [customer, setCustomer] = useState<Customer | null>(null),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [channel, setChannel] = useState("PHONE"),
    [note, setNote] = useState(""),
    [reason, setReason] = useState("");
  const searchGeneration = useRef(0),
    request = useRef<{ fingerprint: string; id: string } | null>(null),
    inFlight = useRef(false);
  const slotGeneration = useRef(0);
  useEffect(() => {
    onBusy?.(busy);
    return () => onBusy?.(false);
  }, [busy, onBusy]);
  function resetSlots() {
    slotGeneration.current++;
    setAvailability(null);
    setSlot(null);
  }
  async function loadSlots() {
    setSearching(true);
    setError("");
    const generation = ++slotGeneration.current;
    try {
      const result = await appointmentsApi.availability({
        branchId: branch,
        serviceId: service,
        professionalId: professional,
        date: day,
        step,
        excludeId: original?.id,
      });
      if (generation === slotGeneration.current) {
        setAvailability(result);
        setSlot(null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  }
  async function search() {
    const generation = ++searchGeneration.current;
    setError("");
    try {
      const result = await appointmentsApi.customers(q);
      if (generation === searchGeneration.current) setCustomers(result.items);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current || !slot) return;
    setError("");
    if (!original && !newCustomer && !customer) {
      setError("Selecciona un cliente o elige Nuevo cliente.");
      return;
    }
    const payload = {
      branchId: branch,
      serviceId: service,
      professionalId: slot.professionalId,
      startsAt: slot.startsAt,
      ...(original
        ? { version: original.version, reason }
        : {
            ...(newCustomer
              ? {
                  customer: {
                    name,
                    phone: phone || null,
                    email: email || null,
                    note: null,
                  },
                }
              : { customerId: customer!.id }),
            channel,
            note: note || null,
          }),
    };
    const fingerprint = JSON.stringify(payload);
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true);
    try {
      const body = { ...payload, requestId: request.current.id };
      onDone(
        original
          ? await appointmentsApi.reschedule(original.id, body)
          : await appointmentsApi.create(body),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const eligible = configuration.professionals.filter(
    (p) =>
      p.branches.some((b) => b.branchId === branch) &&
      p.services.some((s) => s.serviceId === service),
  );
  return (
    <form className="agenda-booking" onSubmit={(e) => void save(e)}>
      <fieldset disabled={busy}>
        <div className="agenda-form-columns">
          <section aria-label="Cuándo y dónde">
            <p className="agenda-overline">01 · Elige un horario</p>
            <div className="agenda-fields">
              <label>
                Sucursal
                <select
                  required
                  value={branch}
                  onChange={(e) => {
                    resetSlots();
                    setBranch(e.target.value);
                    setProfessional("");
                  }}
                >
                  <option value="">Selecciona una sucursal</option>
                  {configuration.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Servicio
                <select
                  required
                  value={service}
                  disabled={!!original}
                  onChange={(e) => {
                    resetSlots();
                    setService(e.target.value);
                    setProfessional("");
                  }}
                >
                  <option value="">Selecciona un servicio</option>
                  {configuration.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.durationMinutes} min
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Profesional
                <select
                  value={professional}
                  disabled={
                    configuration.services.find((s) => s.id === service)
                      ?.bookingMode === "RESOURCE_ONLY"
                  }
                  onChange={(e) => {
                    resetSlots();
                    setProfessional(e.target.value);
                  }}
                >
                  <option value="">Cualquier profesional disponible</option>
                  {eligible.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fecha de la cita
                <input
                  required
                  type="date"
                  value={day}
                  onChange={(e) => {
                    resetSlots();
                    setDay(e.target.value);
                  }}
                />
              </label>
              <label>
                Mostrar inicios cada
                <select
                  value={step}
                  onChange={(e) => {
                    resetSlots();
                    setStep(e.target.value);
                  }}
                >
                  {[5, 10, 15, 20, 30, 60].map((n) => (
                    <option key={n} value={n}>
                      {n} minutos
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              className="agenda-secondary"
              type="button"
              disabled={!branch || !service || !day || searching}
              onClick={() => void loadSlots()}
            >
              {searching ? "Buscando horarios…" : "Buscar horarios disponibles"}
            </button>
            {availability && (
              <div
                className="agenda-slot-results"
                aria-label="Horarios disponibles"
              >
                <p>
                  {availability.durationMinutes} min · {availability.timeZone}
                </p>
                {availability.problems.map((p) => (
                  <p role="status" key={p}>
                    {p}
                  </p>
                ))}
                {!availability.slots.length &&
                  !availability.problems.length && (
                    <p role="status">
                      No hay horas libres. Prueba otra fecha o profesional.
                    </p>
                  )}
                <div className="agenda-slots">
                  {availability.slots.map((s) => (
                    <button
                      type="button"
                      key={s.startsAt + ":" + s.professionalId}
                      aria-pressed={
                        slot?.startsAt === s.startsAt &&
                        slot?.professionalId === s.professionalId
                      }
                      onClick={() => setSlot(s)}
                    >
                      {s.label}
                      <small>
                        {configuration.professionals.find(
                          (p) => p.id === s.professionalId,
                        )?.displayName ?? "Espacio o equipo"}
                      </small>
                    </button>
                  ))}
                </div>
                {availability.truncated && (
                  <p>
                    Hay más opciones. Selecciona un profesional para afinar la
                    consulta.
                  </p>
                )}
              </div>
            )}
          </section>
          <section
            aria-label={original ? "Detalle del cambio" : "Cliente y contacto"}
          >
            <p className="agenda-overline">
              02 · {original ? "Conservamos tu cita" : "¿A quién esperamos?"}
            </p>
            {original ? (
              <>
                <h3>{original.customer.name}</h3>
                <p>
                  {original.snapshot.serviceName} · {original.durationMinutes}{" "}
                  min
                </p>
                <p>
                  Se conservan cliente, canal, duración y condiciones de precio.
                </p>
                <label>
                  Motivo del cambio
                  <textarea
                    required
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <div className="agenda-segment" aria-label="Tipo de cliente">
                  <button
                    type="button"
                    aria-pressed={!newCustomer}
                    onClick={() => setNewCustomer(false)}
                  >
                    Cliente existente
                  </button>
                  <button
                    type="button"
                    aria-pressed={newCustomer}
                    onClick={() => setNewCustomer(true)}
                  >
                    Nuevo cliente
                  </button>
                </div>
                {newCustomer ? (
                  <div className="agenda-fields">
                    <label>
                      Nombre del cliente
                      <input
                        autoComplete="off"
                        required
                        maxLength={120}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label>
                      Teléfono · opcional
                      <input
                        type="tel"
                        maxLength={32}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </label>
                    <label>
                      Correo · opcional
                      <input
                        type="email"
                        maxLength={320}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>
                    <small>
                      Sin cuenta de Noma. No fusionamos contactos
                      automáticamente.
                    </small>
                  </div>
                ) : (
                  <>
                    <label>
                      Buscar cliente por nombre o teléfono
                      <input
                        type="search"
                        value={q}
                        maxLength={120}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void search();
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="agenda-secondary"
                      onClick={() => void search()}
                    >
                      Buscar cliente
                    </button>
                    <div className="agenda-customers">
                      {customers.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          aria-pressed={customer?.id === c.id}
                          onClick={() => setCustomer(c)}
                        >
                          <strong>{c.name}</strong>
                          <small>
                            {c.phone ?? "Sin teléfono"} ·{" "}
                            {c.email ?? "Sin correo"}
                          </small>
                        </button>
                      ))}
                    </div>
                    {customer && (
                      <p role="status">Cliente seleccionado: {customer.name}</p>
                    )}
                  </>
                )}
                <label>
                  Cómo llegó la cita
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="PHONE">Por teléfono</option>
                    <option value="IN_PERSON">En persona</option>
                    <option value="INTERNAL">Registro interno</option>
                  </select>
                </label>
                <label>
                  Notas de la cita · opcional
                  <textarea
                    maxLength={1000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Solo información operativa; sin datos sensibles."
                  />
                </label>
              </>
            )}
          </section>
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <footer className="agenda-form-footer">
          <span>
            {slot
              ? `Elegiste ${slot.label} · ${day}`
              : "Selecciona una hora disponible para continuar."}
          </span>
          <button
            className="agenda-primary"
            disabled={!slot || busy}
            type="submit"
          >
            {busy
              ? "Guardando cita…"
              : original
                ? "Guardar nuevo horario"
                : "Crear cita"}
          </button>
        </footer>
      </fieldset>
    </form>
  );
}
