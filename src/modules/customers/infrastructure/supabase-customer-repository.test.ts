import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createSupabaseCustomerRepository } from "./supabase-customer-repository";

describe("createSupabaseCustomerRepository (peticiones HTTP)", () => {
  it("hace upsert por teléfono y registra el consentimiento", async () => {
    const requests: { url: URL; headers: Headers; body: unknown }[] = [];
    const client = createClient("http://localhost:54321", "test-key", {
      auth: { persistSession: false },
      global: {
        fetch: async (input, init) => {
          requests.push({ url: new URL(String(input)), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
          return new Response(JSON.stringify({ id: "cust-1" }), { status: 201, headers: { "Content-Type": "application/json" } });
        },
      },
    });

    const customer = await createSupabaseCustomerRepository(() => client).upsertByPhone({
      fullName: "Ana Pérez",
      phone: "+573001112233",
      email: "ana@example.com",
      consentedAt: new Date("2026-10-30T15:00:00Z"),
    });

    const [request] = requests;
    expect(customer).toEqual({ id: "cust-1" });
    expect(request.url.searchParams.get("on_conflict")).toBe("phone");
    expect(request.headers.get("Prefer")).toContain("resolution=merge-duplicates");
    expect(request.body).toEqual({
      phone: "+573001112233",
      full_name: "Ana Pérez",
      email: "ana@example.com",
      consented_at: "2026-10-30T15:00:00.000Z",
    });
  });
});
