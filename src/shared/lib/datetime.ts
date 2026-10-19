import { TZDate } from "@date-fns/tz";

/** Fecha local del salón en formato YYYY-MM-DD. */
export type LocalDate = string;

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseLocalDate(date: LocalDate): [number, number, number] {
  const match = LOCAL_DATE_PATTERN.exec(date);
  if (!match) throw new RangeError(`Fecha inválida: ${date}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isValidLocalDate(date: string): boolean {
  const match = LOCAL_DATE_PATTERN.exec(date);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.getUTCFullYear() === y && utc.getUTCMonth() === m - 1 && utc.getUTCDate() === d;
}

/** Convierte una hora local del salón ("HH:mm" o "HH:mm:ss") de una fecha a un instante UTC. */
export function localTimeToInstant(date: LocalDate, time: string, timeZone: string): Date {
  const [y, m, d] = parseLocalDate(date);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hours, minutes, 0, timeZone).getTime());
}

export function addDaysToLocalDate(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = parseLocalDate(date);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Día de la semana ISO: 1 = lunes ... 7 = domingo. */
export function isoWeekday(date: LocalDate): number {
  const [y, m, d] = parseLocalDate(date);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Fecha local (YYYY-MM-DD) que corresponde a un instante en la zona dada. */
export function toLocalDate(instant: Date, timeZone: string): LocalDate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Rango UTC [inicio, fin) que cubre el día local completo. */
export function localDayBounds(date: LocalDate, timeZone: string): { start: Date; end: Date } {
  return {
    start: localTimeToInstant(date, "00:00", timeZone),
    end: localTimeToInstant(addDaysToLocalDate(date, 1), "00:00", timeZone),
  };
}
