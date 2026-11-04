import type { WeekDay, Interval } from "../staff/staff.dto";
const MINUTE = 60000;
export function dayPlus(date: string, days: number) {
  return new Date(Date.parse(date + "T12:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function clock(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
export function localParts(format: Intl.DateTimeFormat, time: number) {
  const p = Object.fromEntries(
    format.formatToParts(time).map((p) => [p.type, p.value]),
  );
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minute: Number(p.hour) * 60 + Number(p.minute),
  };
}
export function dayWindow(date: string, timeZone: string) {
  const f = clock(timeZone),
    center = Date.parse(date + "T12:00:00Z");
  let start = Infinity,
    end = -Infinity;
  // Enumerate actual minutes, including both occurrences of a repeated wall time.
  for (let t = center - 36 * 3600000; t <= center + 36 * 3600000; t += MINUTE) {
    if (localParts(f, t).date === date) {
      start = Math.min(start, t);
      end = t + MINUTE;
    }
  }
  return { start, end };
}
type Schedule = {
  timeZone: string;
  week: unknown;
  exceptions: Array<{ date: Date; kind: string; intervals: unknown }>;
};
function minute(s: string) {
  const [h, m] = s.split(":").map(Number);
  return h! * 60 + m!;
}
export function scheduleMask(
  schedule: Schedule | undefined,
  start: number,
  end: number,
) {
  const size = Math.ceil((end - start) / MINUTE),
    prefix = new Int32Array(size + 1);
  const format = schedule ? clock(schedule.timeZone) : null;
  for (let i = 0; i < size; i++) {
    let allowed = false;
    if (schedule && format) {
      const local = localParts(format, start + i * MINUTE),
        exception = schedule.exceptions.find(
          (e) => e.date.toISOString().slice(0, 10) === local.date,
        );
      const weekday = new Date(local.date + "T12:00:00Z").getUTCDay() || 7;
      const day = (schedule.week as WeekDay[]).find(
        (d) => d.weekday === weekday,
      );
      const intervals = (
        exception
          ? exception.kind === "MODIFIED"
            ? exception.intervals
            : []
          : day && !day.closed
            ? day.intervals
            : []
      ) as Interval[];
      allowed = intervals.some(
        (x) => local.minute >= minute(x.start) && local.minute < minute(x.end),
      );
    }
    prefix[i + 1] = prefix[i]! + (allowed ? 0 : 1);
  }
  return (a: number, b: number) => {
    const l = (a - start) / MINUTE,
      r = (b - start) / MINUTE;
    return (
      Number.isInteger(l) &&
      Number.isInteger(r) &&
      l >= 0 &&
      r <= size &&
      r > l &&
      prefix[r] === prefix[l]
    );
  };
}
export function capacityFits(
  start: number,
  end: number,
  units: number,
  capacity: number,
  occupied: Array<{ startsAt: Date; endsAt: Date; units: number }>,
) {
  const events: Array<[number, number]> = [
    [start, units],
    [end, -units],
  ];
  for (const o of occupied) {
    const a = Math.max(start, o.startsAt.getTime()),
      b = Math.min(end, o.endsAt.getTime());
    if (a < b) {
      events.push([a, o.units], [b, -o.units]);
    }
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let current = 0;
  for (const [, delta] of events) {
    current += delta;
    if (current > capacity) return false;
  }
  return true;
}
