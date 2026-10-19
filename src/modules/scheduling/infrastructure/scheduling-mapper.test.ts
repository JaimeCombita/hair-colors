import { describe, expect, it } from "vitest";
import { toInterval, toWorkingBlock } from "./scheduling-mapper";

describe("toWorkingBlock", () => {
  it("mapea una fila de working_hours", () => {
    expect(toWorkingBlock({ weekday: 1, start_time: "09:00:00", end_time: "12:00:00" })).toEqual({
      weekday: 1,
      startTime: "09:00:00",
      endTime: "12:00:00",
    });
  });
});

describe("toInterval", () => {
  it("convierte el rango tstzrange de Postgres en un intervalo", () => {
    const interval = toInterval({ during: '["2026-11-02 14:00:00+00","2026-11-02 15:00:00+00")' });
    expect(interval.start.toISOString()).toBe("2026-11-02T14:00:00.000Z");
    expect(interval.end.toISOString()).toBe("2026-11-02T15:00:00.000Z");
  });
});
