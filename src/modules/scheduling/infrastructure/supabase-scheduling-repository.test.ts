import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createSupabaseSchedulingRepository } from "./supabase-scheduling-repository";

function createRecordingClient(responder: (url: URL, init?: RequestInit) => Response) {
  const calls: { url: URL; method: string; body?: unknown }[] = [];
  const client = createClient("http://localhost:54321", "test-key", {
    auth: { persistSession: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
        return responder(url, init);
      },
    },
  });
  return { client, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const day = { start: new Date("2026-11-02T05:00:00Z"), end: new Date("2026-11-03T05:00:00Z") };

describe("createSupabaseSchedulingRepository (peticiones HTTP)", () => {
  it("consulta citas activas del estilista que se solapan con el día", async () => {
    const { client, calls } = createRecordingClient(() =>
      json([{ during: '["2026-11-02 14:00:00+00","2026-11-02 15:00:00+00")' }]),
    );
    const repo = createSupabaseSchedulingRepository(() => client);

    const result = await repo.getActiveAppointments("staff-1", day);

    const { url } = calls[0];
    expect(url.pathname).toBe("/rest/v1/appointments");
    expect(url.searchParams.get("staff_id")).toBe("eq.staff-1");
    expect(url.searchParams.get("status")).toBe("neq.cancelled");
    expect(url.searchParams.get("during")).toBe("ov.[2026-11-02T05:00:00.000Z,2026-11-03T05:00:00.000Z)");
    expect(result[0].start.toISOString()).toBe("2026-11-02T14:00:00.000Z");
  });

  it("consulta las ausencias que se solapan con el día", async () => {
    const { client, calls } = createRecordingClient(() => json([]));
    await createSupabaseSchedulingRepository(() => client).getTimeOff("staff-1", day);
    expect(calls[0].url.pathname).toBe("/rest/v1/time_off");
    expect(calls[0].url.searchParams.get("during")).toMatch(/^ov\.\[/);
  });

  it("inserta la cita con el rango en formato tstzrange", async () => {
    const { client, calls } = createRecordingClient(() => json({ id: "appt-1" }, 201));
    const repo = createSupabaseSchedulingRepository(() => client);

    const result = await repo.createAppointment({
      staffId: "staff-1",
      serviceId: "service-1",
      customerId: "cust-1",
      during: { start: new Date("2026-11-02T14:00:00Z"), end: new Date("2026-11-02T15:00:00Z") },
    });

    expect(result).toEqual({ ok: true, value: { id: "appt-1" } });
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toEqual({
      staff_id: "staff-1",
      service_id: "service-1",
      customer_id: "cust-1",
      during: "[2026-11-02T14:00:00.000Z,2026-11-02T15:00:00.000Z)",
    });
  });

  it("traduce la violación de la exclusion constraint (23P01) a SLOT_UNAVAILABLE", async () => {
    const { client } = createRecordingClient(() =>
      json({ code: "23P01", message: "conflicting key value violates exclusion constraint", details: null, hint: null }, 409),
    );
    const result = await createSupabaseSchedulingRepository(() => client).createAppointment({
      staffId: "s",
      serviceId: "v",
      customerId: "c",
      during: { start: new Date("2026-11-02T14:00:00Z"), end: new Date("2026-11-02T15:00:00Z") },
    });
    expect(!result.ok && result.error.code).toBe("SLOT_UNAVAILABLE");
  });

  it("lanza ante errores inesperados de la base de datos", async () => {
    const { client } = createRecordingClient(() => json({ code: "XX000", message: "boom" }, 500));
    const repo = createSupabaseSchedulingRepository(() => client);
    await expect(
      repo.createAppointment({
        staffId: "s",
        serviceId: "v",
        customerId: "c",
        during: { start: new Date("2026-11-02T14:00:00Z"), end: new Date("2026-11-02T15:00:00Z") },
      }),
    ).rejects.toThrow("boom");
  });
});
