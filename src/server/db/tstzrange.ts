export interface DateRange {
  start: Date;
  end: Date;
}

/** Literal `[inicio,fin)` aceptado por Postgres y por los filtros de PostgREST. */
export function formatTstzrange({ start, end }: DateRange): string {
  return `[${start.toISOString()},${end.toISOString()})`;
}

const RANGE_PATTERN = /^[[(]"?([^",]+)"?,"?([^",)\]]+)"?[\])]$/;

/** Convierte `["2026-11-02 14:00:00+00","2026-11-02 15:00:00+00")` en fechas. */
export function parseTstzrange(value: string): DateRange {
  const match = RANGE_PATTERN.exec(value.trim());
  if (!match) throw new Error(`Rango tstzrange inválido: ${value}`);
  return { start: parsePgTimestamp(match[1]), end: parsePgTimestamp(match[2]) };
}

function parsePgTimestamp(value: string): Date {
  let iso = value.trim().replace(" ", "T");
  if (/[+-]\d{2}$/.test(iso)) iso += ":00";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`Timestamp inválido: ${value}`);
  return date;
}
