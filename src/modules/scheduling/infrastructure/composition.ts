import "server-only";
import { catalogService } from "@/modules/catalog";
import { customersService } from "@/modules/customers";
import { staffService } from "@/modules/staff";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { createEventBus } from "@/shared/lib/event-bus";
import { createAppointment, type CreateAppointmentDeps } from "../application/create-appointment";
import { getAvailability, type GetAvailabilityDeps } from "../application/get-availability";
import type { SchedulingEvent } from "../domain/events";
import type { CustomerDirectory, ServiceCatalogReader } from "../domain/repository";
import type { AvailabilityQuery, CreateAppointmentInput } from "../domain/schemas";
import { createSupabaseSchedulingRepository } from "./supabase-scheduling-repository";

/** Adaptadores: traducen otros módulos a los puertos que scheduling necesita. */
const catalog: ServiceCatalogReader = {
  async getService(serviceId) {
    const result = await catalogService.getService(serviceId);
    return result.ok
      ? { id: result.value.id, durationMinutes: result.value.durationMinutes, isActive: result.value.isActive }
      : null;
  },
  staffOffersService: (staffId, serviceId) => staffService.offersService(staffId, serviceId),
};

const customers: CustomerDirectory = {
  upsertCustomer: (input) => customersService.upsertByPhone(input),
};

/** Bus en memoria: sirve para suscriptores dentro del mismo proceso (por ejemplo, notificaciones). */
export const schedulingEvents = createEventBus<SchedulingEvent>({
  onError: (error, event) => console.error(`Falló un suscriptor de ${event.type}`, error),
});

const repository = createSupabaseSchedulingRepository(getSupabaseAdmin);

const availabilityDeps: GetAvailabilityDeps = { scheduling: repository, catalog };
const appointmentDeps: CreateAppointmentDeps = {
  ...availabilityDeps,
  appointments: repository,
  customers,
  events: schedulingEvents,
};

export const schedulingService = {
  getAvailability: (query: AvailabilityQuery) => getAvailability(availabilityDeps, query),
  createAppointment: (input: CreateAppointmentInput) => createAppointment(appointmentDeps, input),
};
