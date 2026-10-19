import { describe, expect, it, vi } from "vitest";
import { err, ok } from "@/shared/lib/result";
import { SchedulingErrorCode, schedulingErrors } from "../domain/errors";
import type { CreateAppointmentInput } from "../domain/schemas";
import { createAppointment, type CreateAppointmentDeps } from "./create-appointment";

const SERVICE_ID = "00000000-0000-0000-0000-0000000000b1";
const STAFF_ID = "00000000-0000-0000-0000-0000000000c1";
// Viernes 10:00 en Bogotá. El lunes 2026-11-02 el estilista trabaja 09:00-12:00.
const NOW = new Date("2026-10-30T15:00:00Z");
const NINE_AM_MONDAY = new Date("2026-11-02T14:00:00Z");

function buildDeps(overrides: Partial<CreateAppointmentDeps> = {}) {
  const deps: CreateAppointmentDeps = {
    scheduling: {
      getWorkingBlocks: vi.fn().mockResolvedValue([{ weekday: 1, startTime: "09:00", endTime: "12:00" }]),
      getTimeOff: vi.fn().mockResolvedValue([]),
      getActiveAppointments: vi.fn().mockResolvedValue([]),
    },
    catalog: {
      getService: vi.fn().mockResolvedValue({ id: SERVICE_ID, durationMinutes: 60, isActive: true }),
      staffOffersService: vi.fn().mockResolvedValue(true),
    },
    appointments: { createAppointment: vi.fn().mockResolvedValue(ok({ id: "appt-1" })) },
    customers: { upsertCustomer: vi.fn().mockResolvedValue({ id: "cust-1" }) },
    events: { publish: vi.fn().mockResolvedValue(undefined) },
    clock: () => NOW,
    ...overrides,
  };
  return deps;
}

const input = (startsAt = NINE_AM_MONDAY): CreateAppointmentInput => ({
  serviceId: SERVICE_ID,
  staffId: STAFF_ID,
  startsAt,
  customer: { fullName: "Ana Pérez", phone: "+573001112233", email: "ana@example.com" },
  consent: true,
  turnstileToken: "token",
});

describe("createAppointment", () => {
  it("crea la cita con la duración del servicio y publica el evento", async () => {
    const deps = buildDeps();
    const result = await createAppointment(deps, input());

    expect(result.ok).toBe(true);
    expect(deps.appointments.createAppointment).toHaveBeenCalledWith({
      staffId: STAFF_ID,
      serviceId: SERVICE_ID,
      customerId: "cust-1",
      during: { start: NINE_AM_MONDAY, end: new Date("2026-11-02T15:00:00Z") },
    });
    expect(deps.events.publish).toHaveBeenCalledWith({
      type: "appointment.created",
      appointmentId: "appt-1",
      staffId: STAFF_ID,
      serviceId: SERVICE_ID,
      customerId: "cust-1",
      startsAt: NINE_AM_MONDAY,
      endsAt: new Date("2026-11-02T15:00:00Z"),
    });
  });

  it("registra el consentimiento con la fecha actual y los datos del cliente", async () => {
    const deps = buildDeps();
    await createAppointment(deps, input());
    expect(deps.customers.upsertCustomer).toHaveBeenCalledWith({
      fullName: "Ana Pérez",
      phone: "+573001112233",
      email: "ana@example.com",
      consentedAt: NOW,
    });
  });

  it.each([
    ["fuera de la cuadrícula", new Date("2026-11-02T14:07:00Z")],
    ["fuera del horario laboral", new Date("2026-11-02T22:00:00Z")],
    ["que no cabe antes del cierre", new Date("2026-11-02T16:30:00Z")],
  ])("rechaza un inicio %s sin tocar clientes ni citas", async (_label, startsAt) => {
    const deps = buildDeps();
    const result = await createAppointment(deps, input(startsAt));

    expect(!result.ok && result.error.code).toBe(SchedulingErrorCode.SlotUnavailable);
    expect(deps.customers.upsertCustomer).not.toHaveBeenCalled();
    expect(deps.appointments.createAppointment).not.toHaveBeenCalled();
  });

  it("rechaza un horario ya ocupado por otra cita", async () => {
    const deps = buildDeps({
      scheduling: {
        getWorkingBlocks: vi.fn().mockResolvedValue([{ weekday: 1, startTime: "09:00", endTime: "12:00" }]),
        getTimeOff: vi.fn().mockResolvedValue([]),
        getActiveAppointments: vi.fn().mockResolvedValue([
          { start: new Date("2026-11-02T14:30:00Z"), end: new Date("2026-11-02T15:30:00Z") },
        ]),
      },
    });
    const result = await createAppointment(deps, input());
    expect(!result.ok && result.error.code).toBe(SchedulingErrorCode.SlotUnavailable);
  });

  it("devuelve SLOT_UNAVAILABLE y no publica si la BD rechaza por una carrera", async () => {
    const deps = buildDeps({
      appointments: { createAppointment: vi.fn().mockResolvedValue(err(schedulingErrors.slotUnavailable())) },
    });
    const result = await createAppointment(deps, input());

    expect(!result.ok && result.error.code).toBe(SchedulingErrorCode.SlotUnavailable);
    expect(deps.events.publish).not.toHaveBeenCalled();
  });

  it("rechaza fechas fuera de la ventana de reserva", async () => {
    const result = await createAppointment(buildDeps(), input(new Date("2026-10-26T14:00:00Z")));
    expect(!result.ok && result.error.code).toBe(SchedulingErrorCode.DateOutOfRange);
  });

  it("falla si el servicio no existe o el estilista no lo ofrece", async () => {
    const missing = buildDeps({
      catalog: { getService: vi.fn().mockResolvedValue(null), staffOffersService: vi.fn() },
    });
    const notOffered = buildDeps({
      catalog: {
        getService: vi.fn().mockResolvedValue({ id: SERVICE_ID, durationMinutes: 60, isActive: true }),
        staffOffersService: vi.fn().mockResolvedValue(false),
      },
    });

    const r1 = await createAppointment(missing, input());
    const r2 = await createAppointment(notOffered, input());

    expect(!r1.ok && r1.error.code).toBe(SchedulingErrorCode.ServiceNotFound);
    expect(!r2.ok && r2.error.code).toBe(SchedulingErrorCode.ServiceNotOffered);
  });
});
