import { isoWeekday, localTimeToInstant, type LocalDate } from "@/shared/lib/datetime";
import { MIN_LEAD_MINUTES, SLOT_STEP_MINUTES } from "./constants";
import { addMinutes, hasConflict } from "./intervals";
import type { TimeInterval, WorkingBlock } from "./types";

export interface AvailabilityInput {
  date: LocalDate;
  timeZone: string;
  serviceDurationMinutes: number;
  workingBlocks: readonly WorkingBlock[];
  /** Citas activas y ausencias del estilista que tocan el día. */
  busy: readonly TimeInterval[];
  now: Date;
  slotStepMinutes?: number;
  minLeadMinutes?: number;
}

/** Bloques laborales del día convertidos a instantes UTC. */
export function workingIntervalsForDate(
  blocks: readonly WorkingBlock[],
  date: LocalDate,
  timeZone: string,
): TimeInterval[] {
  const weekday = isoWeekday(date);
  return blocks
    .filter((block) => block.weekday === weekday)
    .map((block) => ({
      start: localTimeToInstant(date, block.startTime, timeZone),
      end: localTimeToInstant(date, block.endTime, timeZone),
    }));
}

/** Inicios candidatos sobre una cuadrícula que parte del inicio del bloque. */
export function candidateSlots(
  block: TimeInterval,
  durationMinutes: number,
  stepMinutes: number,
): TimeInterval[] {
  const slots: TimeInterval[] = [];
  for (
    let start = block.start;
    addMinutes(start, durationMinutes) <= block.end;
    start = addMinutes(start, stepMinutes)
  ) {
    slots.push({ start, end: addMinutes(start, durationMinutes) });
  }
  return slots;
}

/** Horarios en los que se puede iniciar una cita de la duración pedida, ordenados cronológicamente. */
export function computeAvailableSlots(input: AvailabilityInput): TimeInterval[] {
  const step = input.slotStepMinutes ?? SLOT_STEP_MINUTES;
  const earliestStart = addMinutes(input.now, input.minLeadMinutes ?? MIN_LEAD_MINUTES);

  return workingIntervalsForDate(input.workingBlocks, input.date, input.timeZone)
    .flatMap((block) => candidateSlots(block, input.serviceDurationMinutes, step))
    .filter((slot) => slot.start >= earliestStart)
    .filter((slot) => !hasConflict(slot, input.busy))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
