import { describe, expect, it } from "vitest";
import { staffByServiceQuerySchema } from "./schemas";

describe("staffByServiceQuerySchema", () => {
  it("exige un serviceId con forma de UUID", () => {
    expect(staffByServiceQuerySchema.safeParse({ serviceId: "00000000-0000-0000-0000-0000000000b1" }).success).toBe(true);
    expect(staffByServiceQuerySchema.safeParse({ serviceId: "abc" }).success).toBe(false);
  });
});
