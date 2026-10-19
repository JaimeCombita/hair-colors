export { schedulingService, schedulingEvents } from "./infrastructure/composition";
export {
  availabilityQuerySchema,
  createAppointmentSchema,
  type AvailabilityQuery,
  type CreateAppointmentInput,
} from "./domain/schemas";
export { SchedulingErrorCode } from "./domain/errors";
export type { AppointmentCreatedEvent, SchedulingEvent } from "./domain/events";
export type { CreatedAppointment } from "./application/create-appointment";
export type { TimeInterval, WorkingBlock, BookableService, AppointmentStatus } from "./domain/types";
