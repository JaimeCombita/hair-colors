import type { DomainError } from "@/shared/lib/errors";
import { err, ok, type Result } from "@/shared/lib/result";
import { schedulingErrors } from "../domain/errors";
import type { ServiceCatalogReader } from "../domain/repository";
import type { BookableService } from "../domain/types";

/** Verifica que el servicio esté activo y que el estilista lo ofrezca. */
export async function resolveBookableService(
  catalog: ServiceCatalogReader,
  serviceId: string,
  staffId: string,
): Promise<Result<BookableService, DomainError>> {
  const service = await catalog.getService(serviceId);
  if (!service || !service.isActive) return err(schedulingErrors.serviceNotFound());

  if (!(await catalog.staffOffersService(staffId, serviceId))) {
    return err(schedulingErrors.serviceNotOffered());
  }
  return ok(service);
}
