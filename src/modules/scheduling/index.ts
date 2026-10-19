export { getAvailability, type GetAvailabilityDeps } from "./application/get-availability";
export {
  availabilityQuerySchema,
  createAppointmentSchema,
  type AvailabilityQuery,
  type CreateAppointmentInput,
} from "./domain/schemas";
export { SchedulingErrorCode } from "./domain/errors";
export type {
  SchedulingRepository,
  ServiceCatalogReader,
} from "./domain/repository";
export type { TimeInterval, WorkingBlock, BookableService, AppointmentStatus } from "./domain/types";
