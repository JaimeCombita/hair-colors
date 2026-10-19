import type { DomainError } from "@/shared/lib/errors";
import { err, ok, type Result } from "@/shared/lib/result";
import { catalogErrors } from "../domain/errors";
import type { CatalogRepository } from "../domain/repository";
import type { Service } from "../domain/types";

export interface CatalogDeps {
  catalog: CatalogRepository;
}

export function listServices({ catalog }: CatalogDeps): Promise<Service[]> {
  return catalog.listActiveServices();
}

/** Un servicio inactivo se trata como inexistente para evitar exponerlo. */
export async function getService(
  { catalog }: CatalogDeps,
  id: string,
): Promise<Result<Service, DomainError>> {
  const service = await catalog.findServiceById(id);
  return service?.isActive ? ok(service) : err(catalogErrors.serviceNotFound());
}
