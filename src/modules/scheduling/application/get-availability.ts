import { SALON_TIME_ZONE } from "@/shared/config/constants";
import type { DomainError } from "@/shared/lib/errors";
import { err, ok, type Result } from "@/shared/lib/result";
import { schedulingErrors } from "../domain/errors";
import type { SchedulingRepository, ServiceCatalogReader } from "../domain/repository";
import type { AvailabilityQuery } from "../domain/schemas";
import type { TimeInterval } from "../domain/types";
import { isWithinBookingWindow } from "./booking-window";
import { findAvailableSlots } from "./find-available-slots";
import { resolveBookableService } from "./resolve-bookable-service";

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

  const service = await resolveBookableService(deps.catalog, query.serviceId, query.staffId);
  if (!service.ok) return service;

  return ok(
    await findAvailableSlots(deps.scheduling, {
      staffId: query.staffId,
      service: service.value,
      date: query.date,
      now,
      timeZone,
    }),
  );
}
