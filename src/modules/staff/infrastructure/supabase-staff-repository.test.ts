import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createSupabaseStaffRepository } from "./supabase-staff-repository";

function recordingClient(body: unknown) {
  const urls: URL[] = [];
  const client = createClient("http://localhost:54321", "test-key", {
    auth: { persistSession: false },
    global: {
      fetch: async (input) => {
        urls.push(new URL(String(input)));
        return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  });
  return { client, urls };
}

describe("createSupabaseStaffRepository (peticiones HTTP)", () => {
  it("lista estilistas activos filtrando por servicio con join interno", async () => {
    const { client, urls } = recordingClient([
      { id: "st1", full_name: "Ana", bio: null, photo_url: null, staff_services: [{ service_id: "s1" }] },
    ]);
    const result = await createSupabaseStaffRepository(() => client).listActiveByService("s1");

    const params = urls[0].searchParams;
    expect(urls[0].pathname).toBe("/rest/v1/staff");
    expect(params.get("select")).toContain("staff_services!inner(service_id)");
    expect(params.get("is_active")).toBe("eq.true");
    expect(params.get("staff_services.service_id")).toBe("eq.s1");
    expect(params.get("order")).toBe("sort_order.asc");
    expect(result).toEqual([{ id: "st1", fullName: "Ana", bio: null, photoUrl: null }]);
  });

  it("offersService exige estilista activo y relación con el servicio", async () => {
    const { client, urls } = recordingClient([{ staff_id: "st1", staff: { is_active: true } }]);
    const offers = await createSupabaseStaffRepository(() => client).offersService("st1", "s1");

    const params = urls[0].searchParams;
    expect(offers).toBe(true);
    expect(params.get("staff_id")).toBe("eq.st1");
    expect(params.get("service_id")).toBe("eq.s1");
    expect(params.get("staff.is_active")).toBe("eq.true");
  });

  it("offersService es falso cuando no hay filas", async () => {
    const { client } = recordingClient([]);
    expect(await createSupabaseStaffRepository(() => client).offersService("st1", "s1")).toBe(false);
  });
});
