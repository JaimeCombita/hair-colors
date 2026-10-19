import { localDayBounds, type LocalDate } from "@/shared/lib/datetime";
import { computeAvailableSlots } from "../domain/availability";
import type { SchedulingRepository } from "../domain/repository";
import type { BookableService, TimeInterval } from "../domain/types";

export interface SlotSearch {
  staffId: string;
  service: BookableService;
  date: LocalDate;
  now: Date;
  timeZone: string;
}

/** Carga horario, ausencias y citas del día y calcula los slots libres. */
export async function findAvailableSlots(
  scheduling: SchedulingRepository,
  { staffId, service, date, now, timeZone }: SlotSearch,
): Promise<TimeInterval[]> {
  const day = localDayBounds(date, timeZone);
  const [workingBlocks, timeOff, appointments] = await Promise.all([
    scheduling.getWorkingBlocks(staffId),
    scheduling.getTimeOff(staffId, day),
    scheduling.getActiveAppointments(staffId, day),
  ]);

  return computeAvailableSlots({
    date,
    timeZone,
    serviceDurationMinutes: service.durationMinutes,
    workingBlocks,
    busy: [...timeOff, ...appointments],
    now,
  });
}
