import { domainError } from "@/shared/lib/errors";

export const CatalogErrorCode = {
  ServiceNotFound: "SERVICE_NOT_FOUND",
} as const;

export const catalogErrors = {
  serviceNotFound: () =>
    domainError(CatalogErrorCode.ServiceNotFound, "El servicio no existe o no está activo."),
};
