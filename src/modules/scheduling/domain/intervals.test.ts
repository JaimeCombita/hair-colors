import { describe, expect, it } from "vitest";
import { addMinutes, hasConflict, overlaps } from "./intervals";

const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00Z`);
const range = (from: string, to: string) => ({ start: at(from), end: at(to) });

describe("overlaps", () => {
  it("detecta solapamiento parcial y total", () => {
    expect(overlaps(range("10:00", "11:00"), range("10:30", "11:30"))).toBe(true);
    expect(overlaps(range("10:00", "12:00"), range("10:30", "11:00"))).toBe(true);
  });

  it("trata los intervalos contiguos como no solapados", () => {
    expect(overlaps(range("10:00", "11:00"), range("11:00", "12:00"))).toBe(false);
    expect(overlaps(range("11:00", "12:00"), range("10:00", "11:00"))).toBe(false);
  });
});

describe("hasConflict", () => {
  it("es falso sin intervalos ocupados", () => {
    expect(hasConflict(range("10:00", "11:00"), [])).toBe(false);
  });

  it("es verdadero si alguno se solapa", () => {
    expect(hasConflict(range("10:00", "11:00"), [range("08:00", "09:00"), range("10:45", "12:00")])).toBe(true);
  });
});

describe("addMinutes", () => {
  it("suma sin mutar la fecha original", () => {
    const original = at("10:00");
    expect(addMinutes(original, 45).toISOString()).toBe("2026-11-02T10:45:00.000Z");
    expect(original.toISOString()).toBe("2026-11-02T10:00:00.000Z");
  });
});
