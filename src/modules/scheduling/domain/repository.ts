import type { BookableService, TimeInterval, WorkingBlock } from "./types";

/** Persistencia que necesita el cálculo de disponibilidad. */
export interface SchedulingRepository {
  getWorkingBlocks(staffId: string): Promise<WorkingBlock[]>;
  getTimeOff(staffId: string, range: TimeInterval): Promise<TimeInterval[]>;
  /** Citas no canceladas que tocan el rango. */
  getActiveAppointments(staffId: string, range: TimeInterval): Promise<TimeInterval[]>;
}

/** Lectura del catálogo. La implementa un adaptador sobre el módulo catalog. */
export interface ServiceCatalogReader {
  getService(serviceId: string): Promise<BookableService | null>;
  staffOffersService(staffId: string, serviceId: string): Promise<boolean>;
}
