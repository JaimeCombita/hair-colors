import { describe, expect, it } from "vitest";
import {
  addDaysToLocalDate,
  isoWeekday,
  isValidLocalDate,
  localDayBounds,
  localTimeToInstant,
  toLocalDate,
} from "./datetime";

const BOGOTA = "America/Bogota";

describe("localTimeToInstant", () => {
  it("convierte hora de Bogotá (UTC-5) a UTC", () => {
    expect(localTimeToInstant("2026-11-02", "09:00", BOGOTA).toISOString()).toBe("2026-11-02T14:00:00.000Z");
  });

  it("acepta HH:mm:ss como lo devuelve Postgres", () => {
    expect(localTimeToInstant("2026-11-02", "18:30:00", BOGOTA).toISOString()).toBe("2026-11-02T23:30:00.000Z");
  });
});

describe("isoWeekday", () => {
  it("devuelve 1 para lunes y 7 para domingo", () => {
    expect(isoWeekday("2026-11-02")).toBe(1);
    expect(isoWeekday("2026-11-08")).toBe(7);
  });
});

describe("addDaysToLocalDate", () => {
  it("cruza el fin de mes y de año", () => {
    expect(addDaysToLocalDate("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysToLocalDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("toLocalDate", () => {
  it("usa la fecha de la zona y no la de UTC", () => {
    expect(toLocalDate(new Date("2026-11-03T03:00:00Z"), BOGOTA)).toBe("2026-11-02");
  });
});

describe("isValidLocalDate", () => {
  it("rechaza formatos y fechas de calendario inexistentes", () => {
    expect(isValidLocalDate("2026-11-02")).toBe(true);
    expect(isValidLocalDate("2026-02-30")).toBe(false);
    expect(isValidLocalDate("02/11/2026")).toBe(false);
  });
});

describe("localDayBounds", () => {
  it("cubre 24 horas en Bogotá", () => {
    const { start, end } = localDayBounds("2026-11-02", BOGOTA);
    expect(start.toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-03T05:00:00.000Z");
  });

  it("respeta el cambio de horario en zonas con DST (día de 23 h)", () => {
    const { start, end } = localDayBounds("2026-03-08", "America/New_York");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });
});
