import { request } from "../api/platform";
import type { ServiceOffering } from "../api/offering";
export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
};
export type AppointmentState =
  "PENDING_CONFIRMATION" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export const stateLabels: Record<AppointmentState, string> = {
  PENDING_CONFIRMATION: "Por confirmar",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};
export type Appointment = {
  serverNow?: string;
  id: string;
  branchId: string;
  serviceId: string;
  professionalId: string | null;
  customerId: string;
  customer: Customer;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  durationMinutes: number;
  state: AppointmentState;
  channel: "PHONE" | "IN_PERSON" | "INTERNAL";
  version: number;
  note: string | null;
  snapshot: {
    serviceName: string;
    branchName: string;
    professionalName: string | null;
    priceMode: string;
    priceMin: string | null;
    priceMax: string | null;
    currency: string;
  };
  allocations: Array<{ resourceId: string; units: number }>;
  events?: Array<{
    id: string;
    type: string;
    createdAt: string;
    reason: string | null;
  }>;
};
export type Configuration = {
  branches: Array<{ id: string; name: string; timeZone: string }>;
  services: ServiceOffering[];
  professionals: Array<{
    id: string;
    displayName: string;
    branches: Array<{ branchId: string }>;
    services: Array<{ serviceId: string }>;
  }>;
};
export type Slot = {
  startsAt: string;
  endsAt: string;
  professionalId: string | null;
  label: string;
};
export type Availability = {
  slots: Slot[];
  problems: string[];
  timeZone: string;
  durationMinutes: number;
  truncated?: boolean;
};
export type Agenda = {
  items: Appointment[];
  total: number;
  page: number;
  pageSize: number;
  timeZone: string;
  date: string;
  days: number;
};
const query = (b: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(b)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();
export const appointmentsApi = {
  configuration: () => request<Configuration>("/appointments/configuration"),
  agenda: (b: Record<string, string | number | undefined>) =>
    request<Agenda>("/appointments/agenda?" + query(b)),
  availability: (b: Record<string, string | number | undefined>) =>
    request<Availability>("/appointments/availability?" + query(b)),
  customers: (q: string, page = 1) =>
    request<{
      items: Customer[];
      total: number;
      page: number;
      pageSize: number;
    }>("/appointments/customers?" + query({ q, page })),
  create: (b: unknown) =>
    request<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(b),
    }),
  detail: (id: string) =>
    request<Appointment>("/appointments/" + encodeURIComponent(id)),
  reschedule: (id: string, b: unknown) =>
    request<Appointment>(
      "/appointments/" + encodeURIComponent(id) + "/reschedule",
      { method: "PATCH", body: JSON.stringify(b) },
    ),
  state: (id: string, b: unknown) =>
    request<Appointment>("/appointments/" + encodeURIComponent(id) + "/state", {
      method: "PATCH",
      body: JSON.stringify(b),
    }),
};
export const dayPlus = (date: string, n: number) =>
  new Date(Date.parse(date + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
export function localDate(value: string | Date, zone: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date(value))
      .map((p) => [p.type, p.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}
export const timeLabel = (date: string, zone: string) =>
  new Intl.DateTimeFormat("es-EC", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "shortOffset",
  }).format(new Date(date));
