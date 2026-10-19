import { describe, expect, it } from "vitest";
import { formatTstzrange, parseTstzrange } from "./tstzrange";

describe("formatTstzrange", () => {
  it("genera un rango semiabierto en ISO UTC", () => {
    const range = { start: new Date("2026-11-02T14:00:00Z"), end: new Date("2026-11-02T15:00:00Z") };
    expect(formatTstzrange(range)).toBe("[2026-11-02T14:00:00.000Z,2026-11-02T15:00:00.000Z)");
  });
});

describe("parseTstzrange", () => {
  it("lee el formato que devuelve Postgres", () => {
    const range = parseTstzrange('["2026-11-02 14:00:00+00","2026-11-02 15:00:00+00")');
    expect(range.start.toISOString()).toBe("2026-11-02T14:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-11-02T15:00:00.000Z");
  });

  it("respeta offsets distintos de UTC y fracciones de segundo", () => {
    const range = parseTstzrange('["2026-11-02 09:00:00.5-05","2026-11-02 10:00:00-05")');
    expect(range.start.toISOString()).toBe("2026-11-02T14:00:00.500Z");
    expect(range.end.toISOString()).toBe("2026-11-02T15:00:00.000Z");
  });

  it("hace ida y vuelta con formatTstzrange", () => {
    const original = { start: new Date("2026-11-02T14:00:00Z"), end: new Date("2026-11-02T15:30:00Z") };
    expect(parseTstzrange(formatTstzrange(original))).toEqual(original);
  });

  it("rechaza valores que no son un rango", () => {
    expect(() => parseTstzrange("empty")).toThrow();
    expect(() => parseTstzrange('["no-fecha","tampoco")')).toThrow();
  });
});
