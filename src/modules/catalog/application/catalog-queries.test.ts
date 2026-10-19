import { describe, expect, it, vi } from "vitest";
import { CatalogErrorCode } from "../domain/errors";
import type { Service } from "../domain/types";
import { getService, listServices } from "./catalog-queries";

const service = (overrides: Partial<Service> = {}): Service => ({
  id: "s1",
  name: "Corte",
  description: null,
  durationMinutes: 45,
  priceCop: 50000,
  isActive: true,
  sortOrder: 1,
  ...overrides,
});

describe("listServices", () => {
  it("devuelve los servicios activos del repositorio", async () => {
    const catalog = {
      listActiveServices: vi.fn().mockResolvedValue([service()]),
      findServiceById: vi.fn(),
    };
    expect(await listServices({ catalog })).toEqual([service()]);
  });
});

describe("getService", () => {
  it("devuelve el servicio activo", async () => {
    const catalog = { listActiveServices: vi.fn(), findServiceById: vi.fn().mockResolvedValue(service()) };
    const result = await getService({ catalog }, "s1");
    expect(result).toEqual({ ok: true, value: service() });
  });

  it.each([null, service({ isActive: false })])("devuelve SERVICE_NOT_FOUND para %j", async (found) => {
    const catalog = { listActiveServices: vi.fn(), findServiceById: vi.fn().mockResolvedValue(found) };
    const result = await getService({ catalog }, "s1");
    expect(!result.ok && result.error.code).toBe(CatalogErrorCode.ServiceNotFound);
  });
});
