import { describe, expect, it } from "vitest";
import { computeAvailableSlots, type AvailabilityInput } from "./availability";
import type { TimeInterval, WorkingBlock } from "./types";

const TZ = "America/Bogota";
const MONDAY = "2026-11-02";
const TUESDAY = "2026-11-03";

const blocks: WorkingBlock[] = [
  { weekday: 1, startTime: "09:00:00", endTime: "12:00:00" },
  { weekday: 1, startTime: "14:00:00", endTime: "18:00:00" },
];

const localTime = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);

/** Intervalo en hora local de Bogotá sobre el lunes de prueba. */
const local = (from: string, to: string): TimeInterval => ({
  start: new Date(`${MONDAY}T${from}:00-05:00`),
  end: new Date(`${MONDAY}T${to}:00-05:00`),
});

const starts = (slots: TimeInterval[]) => slots.map((slot) => localTime(slot.start));

function compute(overrides: Partial<AvailabilityInput> = {}) {
  return computeAvailableSlots({
    date: MONDAY,
    timeZone: TZ,
    serviceDurationMinutes: 60,
    workingBlocks: blocks,
    busy: [],
    now: new Date("2026-11-01T12:00:00Z"),
    ...overrides,
  });
}

describe("computeAvailableSlots", () => {
  it("genera slots cada 15 min dentro de cada bloque sin salirse de él", () => {
    const slots = compute();
    expect(slots).toHaveLength(22);
    expect(starts(slots)[0]).toBe("09:00");
    expect(localTime(slots[0].end)).toBe("10:00");
    const morning = starts(slots).filter((time) => time < "12:00");
    expect(morning.at(-1)).toBe("11:00");
    expect(starts(slots).at(-1)).toBe("17:00");
  });

  it("devuelve instantes UTC correctos para Bogotá (UTC-5)", () => {
    expect(compute()[0].start.toISOString()).toBe("2026-11-02T14:00:00.000Z");
  });

  it("excluye los horarios que se solapan con una cita", () => {
    const morning = starts(compute({ busy: [local("10:00", "11:00")] })).filter((time) => time < "12:00");
    expect(morning).toEqual(["09:00", "11:00"]);
  });

  it("permite iniciar justo cuando termina otra cita", () => {
    const morning = starts(compute({ busy: [local("09:00", "10:00")] })).filter((time) => time < "12:00");
    expect(morning).toEqual(["10:00", "10:15", "10:30", "10:45", "11:00"]);
  });

  it("excluye una ausencia que cubre toda la tarde", () => {
    const slots = compute({ busy: [local("13:00", "19:00")] });
    expect(starts(slots).every((time) => time < "12:00")).toBe(true);
  });

  it("respeta la anticipación mínima", () => {
    const slots = compute({ now: new Date(`${MONDAY}T09:30:00-05:00`), minLeadMinutes: 60 });
    expect(starts(slots)[0]).toBe("10:30");
  });

  it("no ofrece horarios pasados el mismo día", () => {
    const slots = compute({ now: new Date(`${MONDAY}T19:00:00-05:00`) });
    expect(slots).toEqual([]);
  });

  it("devuelve vacío en un día sin horario laboral", () => {
    expect(compute({ date: TUESDAY })).toEqual([]);
    expect(compute({ workingBlocks: [] })).toEqual([]);
  });

  it("solo ofrece bloques donde cabe la duración completa", () => {
    const slots = compute({ serviceDurationMinutes: 180 });
    expect(starts(slots)).toEqual(["09:00", "14:00", "14:15", "14:30", "14:45", "15:00"]);
    expect(compute({ serviceDurationMinutes: 300 })).toEqual([]);
  });

  it("acepta una cuadrícula distinta", () => {
    const slots = compute({ slotStepMinutes: 30, workingBlocks: [blocks[0]] });
    expect(starts(slots)).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });

  it("devuelve los slots ordenados aunque los bloques lleguen desordenados", () => {
    const slots = compute({ workingBlocks: [blocks[1], blocks[0]] });
    expect(starts(slots)).toEqual([...starts(slots)].sort());
  });
});
