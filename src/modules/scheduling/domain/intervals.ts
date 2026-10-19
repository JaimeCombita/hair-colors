import type { TimeInterval } from "./types";

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function hasConflict(candidate: TimeInterval, busy: readonly TimeInterval[]): boolean {
  return busy.some((interval) => overlaps(candidate, interval));
}
