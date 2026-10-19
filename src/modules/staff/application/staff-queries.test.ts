import { describe, expect, it, vi } from "vitest";
import { listStaffByService, staffOffersService } from "./staff-queries";

const stylist = { id: "st1", fullName: "Ana", bio: null, photoUrl: null };

describe("staff queries", () => {
  it("lista los estilistas del servicio", async () => {
    const staff = { listActiveByService: vi.fn().mockResolvedValue([stylist]), offersService: vi.fn() };
    expect(await listStaffByService({ staff }, "s1")).toEqual([stylist]);
    expect(staff.listActiveByService).toHaveBeenCalledWith("s1");
  });

  it("consulta si el estilista ofrece el servicio", async () => {
    const staff = { listActiveByService: vi.fn(), offersService: vi.fn().mockResolvedValue(true) };
    expect(await staffOffersService({ staff }, "st1", "s1")).toBe(true);
    expect(staff.offersService).toHaveBeenCalledWith("st1", "s1");
  });
});
