import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdRow, RangeRow, WorkingHoursRow } from "@/server/db/rows";
import { formatTstzrange } from "@/server/db/tstzrange";
import { PG_EXCLUSION_VIOLATION, unwrapRows } from "@/server/db/unwrap";
import { err, ok } from "@/shared/lib/result";
import { schedulingErrors } from "../domain/errors";
import type { AppointmentWriter, SchedulingRepository } from "../domain/repository";
import { toInterval, toWorkingBlock } from "./scheduling-mapper";

export function createSupabaseSchedulingRepository(
  getClient: () => SupabaseClient,
): SchedulingRepository & AppointmentWriter {
  return {
    async getWorkingBlocks(staffId) {
      const rows = unwrapRows<WorkingHoursRow>(
        await getClient().from("working_hours").select("weekday, start_time, end_time").eq("staff_id", staffId),
      );
      return rows.map(toWorkingBlock);
    },

    async getTimeOff(staffId, range) {
      const rows = unwrapRows<RangeRow>(
        await getClient()
          .from("time_off")
          .select("during")
          .eq("staff_id", staffId)
          .overlaps("during", formatTstzrange(range)),
      );
      return rows.map(toInterval);
    },

    async getActiveAppointments(staffId, range) {
      const rows = unwrapRows<RangeRow>(
        await getClient()
          .from("appointments")
          .select("during")
          .eq("staff_id", staffId)
          .neq("status", "cancelled")
          .overlaps("during", formatTstzrange(range)),
      );
      return rows.map(toInterval);
    },

    async createAppointment({ staffId, serviceId, customerId, during }) {
      const { data, error } = await getClient()
        .from("appointments")
        .insert({
          staff_id: staffId,
          service_id: serviceId,
          customer_id: customerId,
          during: formatTstzrange(during),
        })
        .select("id")
        .single<IdRow>();

      if (error?.code === PG_EXCLUSION_VIOLATION) return err(schedulingErrors.slotUnavailable());
      if (error || !data) throw new Error(error?.message ?? "No se pudo crear la cita.");
      return ok({ id: data.id });
    },
  };
}
