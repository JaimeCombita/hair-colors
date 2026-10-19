import { SALON_TIME_ZONE } from "@/shared/config/constants";
import { localDayBounds, addDaysToLocalDate, toLocalDate } from "@/shared/lib/datetime";
import type { DomainError } from "@/shared/lib/errors";
import { err, ok, type Result } from "@/shared/lib/result";
import { computeAvailableSlots } from "../domain/availability";
import { MAX_ADVANCE_DAYS } from "../domain/constants";
import { schedulingErrors } from "../domain/errors";
import type { SchedulingRepository, ServiceCatalogReader } from "../domain/repository";
import type { AvailabilityQuery } from "../domain/schemas";
import type { TimeInterval } from "../domain/types";

export interface GetAvailabilityDeps {
  scheduling: SchedulingRepository;
  catalog: ServiceCatalogReader;
  clock?: () => Date;
  timeZone?: string;
}

export async function getAvailability(
  deps: GetAvailabilityDeps,
  query: AvailabilityQuery,
): Promise<Result<TimeInterval[], DomainError>> {
  const now = (deps.clock ?? (() => new Date()))();
  const timeZone = deps.timeZone ?? SALON_TIME_ZONE;

  if (!isWithinBookingWindow(query.date, now, timeZone)) {
    return err(schedulingErrors.dateOutOfRange());
  }

  const service = await deps.catalog.getService(query.serviceId);
  if (!service || !service.isActive) return err(schedulingErrors.serviceNotFound());

  if (!(await deps.catalog.staffOffersService(query.staffId, query.serviceId))) {
    return err(schedulingErrors.serviceNotOffered());
  }

  const day = localDayBounds(query.date, timeZone);
  const [workingBlocks, timeOff, appointments] = await Promise.all([
    deps.scheduling.getWorkingBlocks(query.staffId),
    deps.scheduling.getTimeOff(query.staffId, day),
    deps.scheduling.getActiveAppointments(query.staffId, day),
  ]);

  return ok(
    computeAvailableSlots({
      date: query.date,
      timeZone,
      serviceDurationMinutes: service.durationMinutes,
      workingBlocks,
      busy: [...timeOff, ...appointments],
      now,
    }),
  );
}

function isWithinBookingWindow(date: string, now: Date, timeZone: string): boolean {
  const today = toLocalDate(now, timeZone);
  return date >= today && date <= addDaysToLocalDate(today, MAX_ADVANCE_DAYS);
}
