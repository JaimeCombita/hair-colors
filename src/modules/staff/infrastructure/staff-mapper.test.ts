import { describe, expect, it } from "vitest";
import { toStaff } from "./staff-mapper";

describe("toStaff", () => {
  it("mapea la fila de la base de datos a la entidad", () => {
    expect(toStaff({ id: "st1", full_name: "Ana", bio: null, photo_url: "https://x/y.jpg" })).toEqual({
      id: "st1",
      fullName: "Ana",
      bio: null,
      photoUrl: "https://x/y.jpg",
    });
  });
});
