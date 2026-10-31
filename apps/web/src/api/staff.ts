import { request } from "./platform";
export type Interval = { start: string; end: string };
export type WeekDay = {
  weekday: number;
  closed: boolean;
  intervals: Interval[];
};
type RecordBase = {
  id: string;
  establishmentId: string;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type BranchDraft = {
  name: string;
  address: string | null;
  timeZone: string;
  isDefault: boolean;
};
export type Branch = RecordBase & BranchDraft;
export type ProfessionalDraft = {
  displayName: string;
  specialty: string | null;
  branchIds: string[];
  serviceIds: string[];
};
export type Professional = RecordBase & ProfessionalDraft;
export type ResourceDraft = {
  branchId: string;
  name: string;
  typeDescription: string | null;
  capacity: number;
};
export type Resource = RecordBase & ResourceDraft;
export type ScheduleDraft = {
  branchId: string;
  professionalId: string | null;
  timeZone: string;
  week: WeekDay[];
  version: number | null;
};
export type Schedule = Omit<RecordBase, "active"> & ScheduleDraft;
export type ExceptionDraft = {
  date: string;
  kind: "ABSENCE" | "CLOSURE" | "MODIFIED";
  intervals: Interval[];
  note: string | null;
};
export type ScheduleException = RecordBase &
  ExceptionDraft & { scheduleId: string };
export type Requirements = {
  branchId: string;
  serviceId: string;
  version: number;
  resources: { resourceId: string; units: number }[];
};
export type Configuration = {
  branches: Branch[];
  professionals: Professional[];
  resources: Resource[];
  schedules: Schedule[];
  exceptions: ScheduleException[];
  requirements: Requirements[];
};
export type Mutation = { id: string; configuration: Configuration };
export type EntityKind = "branches" | "professionals" | "resources";
const send = (path: string, method: string, body: unknown) =>
  request<Mutation>(`/staff/${path}`, { method, body: JSON.stringify(body) });
export const staffApi = {
  removeProfessional: (id: string, version: number) =>
    send(`professionals/${encodeURIComponent(id)}`, "DELETE", { version }),
  configuration: () => request<Configuration>("/staff/configuration"),
  branch: (data: BranchDraft, id?: string, version?: number) =>
    send(
      `branches${id ? `/${encodeURIComponent(id)}` : ""}`,
      id ? "PATCH" : "POST",
      { ...data, ...(id ? { version } : {}) },
    ),
  professional: (data: ProfessionalDraft, id?: string, version?: number) =>
    send(
      `professionals${id ? `/${encodeURIComponent(id)}` : ""}`,
      id ? "PATCH" : "POST",
      { ...data, ...(id ? { version } : {}) },
    ),
  resource: (data: ResourceDraft, id?: string, version?: number) =>
    send(
      `resources${id ? `/${encodeURIComponent(id)}` : ""}`,
      id ? "PATCH" : "POST",
      { ...data, ...(id ? { version } : {}) },
    ),
  status: (
    kind: EntityKind | "exceptions",
    id: string,
    active: boolean,
    version: number,
  ) =>
    send(`${kind}/${encodeURIComponent(id)}/status`, "PATCH", {
      active,
      version,
    }),
  schedule: (data: ScheduleDraft) => send("schedules", "PUT", data),
  exception: (
    scheduleId: string,
    data: ExceptionDraft,
    id?: string,
    version?: number,
  ) =>
    send(
      id
        ? `exceptions/${encodeURIComponent(id)}`
        : `schedules/${encodeURIComponent(scheduleId)}/exceptions`,
      id ? "PATCH" : "POST",
      { ...data, ...(id ? { version } : {}) },
    ),
  requirements: (
    branchId: string,
    serviceId: string,
    resources: Requirements["resources"],
    version: number | null,
  ) =>
    send(
      `branches/${encodeURIComponent(branchId)}/services/${encodeURIComponent(serviceId)}/resources`,
      "PUT",
      { resources, version },
    ),
};
