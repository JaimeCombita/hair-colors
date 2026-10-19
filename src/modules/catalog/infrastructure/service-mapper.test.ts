import { describe, expect, it } from "vitest";
import { toService } from "./service-mapper";

describe("toService", () => {
  it("mapea la fila de la base de datos a la entidad", () => {
    expect(
      toService({
        id: "s1",
        name: "Corte",
        description: "Corte y peinado",
        duration_minutes: 45,
        price_cop: 50000,
        is_active: true,
        sort_order: 2,
      }),
    ).toEqual({
      id: "s1",
      name: "Corte",
      description: "Corte y peinado",
      durationMinutes: 45,
      priceCop: 50000,
      isActive: true,
      sortOrder: 2,
    });
  });
});
