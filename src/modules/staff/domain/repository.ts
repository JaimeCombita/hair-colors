import type { Staff } from "./types";

export interface StaffRepository {
  /** Estilistas activos que ofrecen el servicio, ordenados por `sortOrder`. */
  listActiveByService(serviceId: string): Promise<Staff[]>;
  /** Verdadero solo si el estilista está activo y ofrece el servicio. */
  offersService(staffId: string, serviceId: string): Promise<boolean>;
}
