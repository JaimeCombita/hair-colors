import { addDaysToLocalDate, toLocalDate, type LocalDate } from "@/shared/lib/datetime";
import { MAX_ADVANCE_DAYS } from "../domain/constants";

/** La fecha local debe estar entre hoy y hoy + MAX_ADVANCE_DAYS (inclusive). */
export function isWithinBookingWindow(date: LocalDate, now: Date, timeZone: string): boolean {
  const today = toLocalDate(now, timeZone);
  return date >= today && date <= addDaysToLocalDate(today, MAX_ADVANCE_DAYS);
}
