import { z } from "zod";

export const staffByServiceQuerySchema = z.object({
  // guid acepta cualquier UUID con forma válida, igual que Postgres.
  serviceId: z.guid(),
});

export type StaffByServiceQuery = z.infer<typeof staffByServiceQuerySchema>;
