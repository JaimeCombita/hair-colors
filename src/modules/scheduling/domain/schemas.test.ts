import { describe, expect, it } from "vitest";
import { availabilityQuerySchema, createAppointmentSchema } from "./schemas";

const UUID_A = "00000000-0000-0000-0000-0000000000b1";
const UUID_B = "00000000-0000-0000-0000-0000000000c1";

const validAppointment = {
  serviceId: UUID_A,
  staffId: UUID_B,
  startsAt: "2026-11-02T14:00:00Z",
  customer: { fullName: "  Ana Pérez ", phone: "300 111 2233", email: " ANA@Example.com " },
  consent: true,
  turnstileToken: "token",
};

describe("availabilityQuerySchema", () => {
  it("acepta una consulta válida", () => {
    expect(availabilityQuerySchema.safeParse({ serviceId: UUID_A, staffId: UUID_B, date: "2026-11-02" }).success).toBe(true);
  });

  it.each(["2026-02-30", "02-11-2026", ""])("rechaza la fecha %j", (date) => {
    expect(availabilityQuerySchema.safeParse({ serviceId: UUID_A, staffId: UUID_B, date }).success).toBe(false);
  });

  it("rechaza ids que no son UUID", () => {
    expect(availabilityQuerySchema.safeParse({ serviceId: "1", staffId: UUID_B, date: "2026-11-02" }).success).toBe(false);
  });
});

describe("createAppointmentSchema", () => {
  it("normaliza nombre, teléfono, email y fecha de inicio", () => {
    const parsed = createAppointmentSchema.parse(validAppointment);
    expect(parsed.customer).toEqual({ fullName: "Ana Pérez", phone: "+573001112233", email: "ana@example.com" });
    expect(parsed.startsAt).toEqual(new Date("2026-11-02T14:00:00Z"));
  });

  it("exige el consentimiento de tratamiento de datos", () => {
    expect(createAppointmentSchema.safeParse({ ...validAppointment, consent: false }).success).toBe(false);
  });

  it("rechaza teléfonos inválidos", () => {
    const result = createAppointmentSchema.safeParse({
      ...validAppointment,
      customer: { ...validAppointment.customer, phone: "123" },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza fechas de inicio sin zona horaria", () => {
    expect(createAppointmentSchema.safeParse({ ...validAppointment, startsAt: "2026-11-02T09:00:00" }).success).toBe(false);
  });
});
