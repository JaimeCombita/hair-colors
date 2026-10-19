import { z } from "zod";
import { isValidLocalDate } from "@/shared/lib/datetime";
import { normalizePhone } from "@/shared/lib/phone";

const localDate = z.string().refine(isValidLocalDate, "Fecha inválida, usa YYYY-MM-DD");
// guid acepta cualquier UUID con forma válida, igual que Postgres (z.uuid() exige versión RFC y rechazaría los ids del seed).
const id = z.guid();

export const availabilityQuerySchema = z.object({
  serviceId: id,
  staffId: id,
  date: localDate,
});

export const customerInputSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .transform((value, ctx) => {
      const normalized = normalizePhone(value);
      if (!normalized) ctx.addIssue({ code: "custom", message: "Teléfono inválido" });
      return normalized ?? z.NEVER;
    }),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export const createAppointmentSchema = z.object({
  serviceId: id,
  staffId: id,
  startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  customer: customerInputSchema,
  consent: z.literal(true, "Debes autorizar el tratamiento de datos personales"),
  turnstileToken: z.string().min(1),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
