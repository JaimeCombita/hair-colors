import { describe, expect, it, vi } from "vitest";
import { SchedulingErrorCode } from "../domain/errors";
import type { SchedulingRepository, ServiceCatalogReader } from "../domain/repository";
import { getAvailability, type GetAvailabilityDeps } from "./get-availability";

const SERVICE_ID = "00000000-0000-0000-0000-0000000000b1";
const STAFF_ID = "00000000-0000-0000-0000-0000000000c1";
// Viernes 10:00 en Bogotá.
const NOW = new Date("2026-10-30T15:00:00Z");

function buildDeps(overrides: Partial<{ scheduling: Partial<SchedulingRepository>; catalog: Partial<ServiceCatalogReader> }> = {}) {
  const scheduling: SchedulingRepository = {
    getWorkingBlocks: vi.fn().mockResolvedValue([{ weekday: 1, startTime: "09:00", endTime: "12:00" }]),
    getTimeOff: vi.fn().mockResolvedValue([]),
    getActiveAppointments: vi.fn().mockResolvedValue([]),
    ...overrides.scheduling,
  };
  const catalog: ServiceCatalogReader = {
    getService: vi.fn().mockResolvedValue({ id: SERVICE_ID, durationMinutes: 60, isActive: true }),
    staffOffersService: vi.fn().mockResolvedValue(true),
    ...overrides.catalog,
  };
  const deps: GetAvailabilityDeps = { scheduling, catalog, clock: () => NOW };
  return { deps, scheduling, catalog };
}

const query = (date: string) => ({ serviceId: SERVICE_ID, staffId: STAFF_ID, date });

describe("getAvailability", () => {
  it("devuelve los horarios libres del estilista", async () => {
    const { deps } = buildDeps();
    const result = await getAvailability(deps, query("2026-11-02"));
    expect(result.ok && result.value).toHaveLength(9);
  });

  it("consulta los datos usando los límites UTC del día local", async () => {
    const { deps, scheduling } = buildDeps();
    await getAvailability(deps, query("2026-11-02"));
    const range = vi.mocked(scheduling.getActiveAppointments).mock.calls[0][1];
    expect(range.start.toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-11-03T05:00:00.000Z");
  });

  it("descuenta citas y ausencias", async () => {
    const { deps } = buildDeps({
      scheduling: {
        getActiveAppointments: vi.fn().mockResolvedValue([
          { start: new Date("2026-11-02T14:00:00Z"), end: new Date("2026-11-02T15:00:00Z") },
        ]),
        getTimeOff: vi.fn().mockResolvedValue([
          { start: new Date("2026-11-02T16:00:00Z"), end: new Date("2026-11-02T17:00:00Z") },
        ]),
      },
    });
    const result = await getAvailability(deps, query("2026-11-02"));
    expect(result.ok && result.value.map((s) => s.start.toISOString())).toEqual(["2026-11-02T15:00:00.000Z"]);
  });

  it("rechaza fechas pasadas", async () => {
    const { deps } = buildDeps();
    const result = await getAvailability(deps, query("2026-10-29"));
    expect(!result.ok && result.error.code).toBe(SchedulingErrorCode.DateOutOfRange);
  });

  it("rechaza fechas más allá de la ventana de reserva", async () => {
    const { deps } = buildDeps();
    const result = await getAvailability(deps, query("2027-02-01"));
    expect(!result.ok && result.error.code).toBe(SchedulingErrorCode.DateOutOfRange);
  });

  it("acepta el último día de la ventana", async () => {
    const { deps } = buildDeps();
    const result = await getAvailability(deps, query("2026-12-29"));
    expect(result.ok).toBe(true);
  });

  it("falla si el servicio no existe o está inactivo", async () => {
    const missing = buildDeps({ catalog: { getService: vi.fn().mockResolvedValue(null) } });
    const inactive = buildDeps({
      catalog: { getService: vi.fn().mockResolvedValue({ id: SERVICE_ID, durationMinutes: 60, isActive: false }) },
    });
    for (const { deps } of [missing, inactive]) {
      const result = await getAvailability(deps, query("2026-11-02"));
      expect(!result.ok && result.error.code).toBe(SchedulingErrorCode.ServiceNotFound);
    }
  });

  it("falla si el estilista no ofrece el servicio y no consulta la agenda", async () => {
    const { deps, scheduling } = buildDeps({ catalog: { staffOffersService: vi.fn().mockResolvedValue(false) } });
    const result = await getAvailability(deps, query("2026-11-02"));
    expect(!result.ok && result.error.code).toBe(SchedulingErrorCode.ServiceNotOffered);
    expect(scheduling.getWorkingBlocks).not.toHaveBeenCalled();
  });
});
