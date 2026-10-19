import { SALON_TIME_ZONE } from "@/shared/config/constants";
import { toLocalDate } from "@/shared/lib/datetime";
import type { DomainError } from "@/shared/lib/errors";
import { err, ok, type Result } from "@/shared/lib/result";
import { schedulingErrors } from "../domain/errors";
import type { SchedulingEventPublisher } from "../domain/events";
import type { AppointmentWriter, CustomerDirectory } from "../domain/repository";
import type { CreateAppointmentInput } from "../domain/schemas";
import type { TimeInterval } from "../domain/types";
import { isWithinBookingWindow } from "./booking-window";
import { findAvailableSlots } from "./find-available-slots";
import type { GetAvailabilityDeps } from "./get-availability";
import { resolveBookableService } from "./resolve-bookable-service";

export interface CreateAppointmentDeps extends GetAvailabilityDeps {
  appointments: AppointmentWriter;
  customers: CustomerDirectory;
  events: SchedulingEventPublisher;
}

export interface CreatedAppointment {
  id: string;
  staffId: string;
  serviceId: string;
  customerId: string;
  during: TimeInterval;
}

/**
 * La entrada ya viene validada (Zod) y con el captcha verificado en la capa de transporte.
 * El slot se recalcula en el servidor; la constraint de la BD resuelve las carreras entre dos reservas.
 */
export async function createAppointment(
  deps: CreateAppointmentDeps,
  input: CreateAppointmentInput,
): Promise<Result<CreatedAppointment, DomainError>> {
  const now = (deps.clock ?? (() => new Date()))();
  const timeZone = deps.timeZone ?? SALON_TIME_ZONE;
  const date = toLocalDate(input.startsAt, timeZone);

  if (!isWithinBookingWindow(date, now, timeZone)) {
    return err(schedulingErrors.dateOutOfRange());
  }

  const service = await resolveBookableService(deps.catalog, input.serviceId, input.staffId);
  if (!service.ok) return service;

  const slots = await findAvailableSlots(deps.scheduling, {
    staffId: input.staffId,
    service: service.value,
    date,
    now,
    timeZone,
  });
  const slot = slots.find((candidate) => candidate.start.getTime() === input.startsAt.getTime());
  if (!slot) return err(schedulingErrors.slotUnavailable());

  const customer = await deps.customers.upsertCustomer({ ...input.customer, consentedAt: now });
  const created = await deps.appointments.createAppointment({
    staffId: input.staffId,
    serviceId: input.serviceId,
    customerId: customer.id,
    during: slot,
  });
  if (!created.ok) return created;

  const appointment: CreatedAppointment = {
    id: created.value.id,
    staffId: input.staffId,
    serviceId: input.serviceId,
    customerId: customer.id,
    during: slot,
  };
  await deps.events.publish({
    type: "appointment.created",
    appointmentId: appointment.id,
    staffId: appointment.staffId,
    serviceId: appointment.serviceId,
    customerId: appointment.customerId,
    startsAt: slot.start,
    endsAt: slot.end,
  });

  return ok(appointment);
}
