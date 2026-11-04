import type { WeekDay } from "../api/staff";
export const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
export const emptyWeek = (): WeekDay[] =>
  Array.from({ length: 7 }, (_, weekday) => ({
    weekday: weekday + 1,
    closed: true,
    intervals: [],
  }));
export function ScheduleFields({
  week,
  onChange,
}: {
  week: WeekDay[];
  onChange: (week: WeekDay[]) => void;
}) {
  function update(index: number, change: Partial<WeekDay>) {
    onChange(week.map((day, i) => (i === index ? { ...day, ...change } : day)));
  }
  return (
    <div className="onboard-week">
      <div className="onboard-note">
        <p>
          Indica cuándo atiendes. Puedes dividir un día para incluir una pausa.
        </p>
        <button
          type="button"
          className="onboard-text"
          onClick={() =>
            onChange(
              emptyWeek().map((day) =>
                day.weekday <= 5
                  ? {
                      ...day,
                      closed: false,
                      intervals: [{ start: "09:00", end: "18:00" }],
                    }
                  : day,
              ),
            )
          }
        >
          Usar lunes a viernes, de 09:00 a 18:00
        </button>
        <small>
          Es una sugerencia editable. Solo se guardará al confirmar el horario.
        </small>
      </div>
      {week.map((day, index) => (
        <div className="onboard-day" key={day.weekday}>
          <label className="onboard-check">
            <input
              type="checkbox"
              checked={!day.closed}
              onChange={(e) =>
                update(index, {
                  closed: !e.target.checked,
                  intervals: e.target.checked
                    ? [{ start: "09:00", end: "18:00" }]
                    : [],
                })
              }
            />
            {DAY_NAMES[day.weekday - 1]}
          </label>
          <div>
            {day.closed ? (
              <span className="onboard-muted">Cerrado</span>
            ) : (
              <>
                {day.intervals.map((interval, i) => (
                  <div className="onboard-interval" key={i}>
                    <label>
                      <span className="sr-only">
                        {DAY_NAMES[day.weekday - 1]} inicio {i + 1}
                      </span>
                      <input
                        aria-label={`${DAY_NAMES[day.weekday - 1]} inicio ${i + 1}`}
                        type="time"
                        required
                        value={interval.start}
                        onChange={(e) =>
                          update(index, {
                            intervals: day.intervals.map((item, j) =>
                              j === i
                                ? { ...item, start: e.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                    <span aria-hidden="true">—</span>
                    <label>
                      <span className="sr-only">
                        {DAY_NAMES[day.weekday - 1]} fin {i + 1}
                      </span>
                      <input
                        aria-label={`${DAY_NAMES[day.weekday - 1]} fin ${i + 1}`}
                        type="time"
                        required
                        value={interval.end}
                        onChange={(e) =>
                          update(index, {
                            intervals: day.intervals.map((item, j) =>
                              j === i ? { ...item, end: e.target.value } : item,
                            ),
                          })
                        }
                      />
                    </label>
                    {day.intervals.length > 1 && (
                      <button
                        className="onboard-text"
                        type="button"
                        aria-label={`Quitar intervalo ${i + 1} de ${DAY_NAMES[day.weekday - 1]}`}
                        onClick={() =>
                          update(index, {
                            intervals: day.intervals.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ))}
                {day.intervals.length < 4 && (
                  <button
                    type="button"
                    className="onboard-text"
                    onClick={() =>
                      update(index, {
                        intervals: [
                          ...day.intervals,
                          { start: "18:00", end: "19:00" },
                        ],
                      })
                    }
                  >
                    Añadir otro intervalo
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
