import type { Service } from "./types";

export interface CatalogRepository {
  /** Servicios activos ordenados por `sortOrder`. */
  listActiveServices(): Promise<Service[]>;
  findServiceById(id: string): Promise<Service | null>;
}
