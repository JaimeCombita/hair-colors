import type { DomainError } from "@/shared/lib/errors";
import type { Result } from "@/shared/lib/result";
import type { BookableService, TimeInterval, WorkingBlock } from "./types";

/** Lecturas que necesita el cálculo de disponibilidad. */
export interface SchedulingRepository {
  getWorkingBlocks(staffId: string): Promise<WorkingBlock[]>;
  getTimeOff(staffId: string, range: TimeInterval): Promise<TimeInterval[]>;
  /** Citas no canceladas que tocan el rango. */
  getActiveAppointments(staffId: string, range: TimeInterval): Promise<TimeInterval[]>;
}

export interface NewAppointment {
  staffId: string;
  serviceId: string;
  customerId: string;
  during: TimeInterval;
}

export interface AppointmentWriter {
  /** Devuelve SLOT_UNAVAILABLE si la base de datos rechaza la cita por solapamiento. */
  createAppointment(appointment: NewAppointment): Promise<Result<{ id: string }, DomainError>>;
}

/** Lectura del catálogo. La implementa un adaptador sobre los módulos catalog y staff. */
export interface ServiceCatalogReader {
  getService(serviceId: string): Promise<BookableService | null>;
  staffOffersService(staffId: string, serviceId: string): Promise<boolean>;
}

/** Alta de clientes. La implementa un adaptador sobre el módulo customers. */
export interface CustomerDirectory {
  upsertCustomer(input: {
    fullName: string;
    phone: string;
    email: string;
    consentedAt: Date;
  }): Promise<{ id: string }>;
}
