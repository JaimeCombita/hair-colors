import { domainError } from "@/shared/lib/errors";

export const SchedulingErrorCode = {
  ServiceNotFound: "SERVICE_NOT_FOUND",
  ServiceNotOffered: "SERVICE_NOT_OFFERED_BY_STAFF",
  DateOutOfRange: "DATE_OUT_OF_RANGE",
  SlotUnavailable: "SLOT_UNAVAILABLE",
  AppointmentNotFound: "APPOINTMENT_NOT_FOUND",
} as const;

export type SchedulingErrorCode = (typeof SchedulingErrorCode)[keyof typeof SchedulingErrorCode];

export const schedulingErrors = {
  serviceNotFound: () =>
    domainError(SchedulingErrorCode.ServiceNotFound, "El servicio no existe o no está activo."),
  serviceNotOffered: () =>
    domainError(SchedulingErrorCode.ServiceNotOffered, "El estilista no ofrece este servicio."),
  dateOutOfRange: () =>
    domainError(SchedulingErrorCode.DateOutOfRange, "La fecha está fuera del rango permitido para reservar."),
  slotUnavailable: () =>
    domainError(SchedulingErrorCode.SlotUnavailable, "El horario seleccionado ya no está disponible."),
  appointmentNotFound: () =>
    domainError(SchedulingErrorCode.AppointmentNotFound, "La cita no existe."),
};
