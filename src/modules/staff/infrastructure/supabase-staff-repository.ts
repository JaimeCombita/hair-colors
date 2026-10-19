import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffRow } from "@/server/db/rows";
import { unwrapRows } from "@/server/db/unwrap";
import type { StaffRepository } from "../domain/repository";
import { toStaff } from "./staff-mapper";

export function createSupabaseStaffRepository(getClient: () => SupabaseClient): StaffRepository {
  return {
    async listActiveByService(serviceId) {
      const rows = unwrapRows<StaffRow>(
        await getClient()
          .from("staff")
          .select("id, full_name, bio, photo_url, staff_services!inner(service_id)")
          .eq("is_active", true)
          .eq("staff_services.service_id", serviceId)
          .order("sort_order"),
      );
      return rows.map(toStaff);
    },

    async offersService(staffId, serviceId) {
      const rows = unwrapRows<{ staff_id: string }>(
        await getClient()
          .from("staff_services")
          .select("staff_id, staff!inner(is_active)")
          .eq("staff_id", staffId)
          .eq("service_id", serviceId)
          .eq("staff.is_active", true)
          .limit(1),
      );
      return rows.length > 0;
    },
  };
}
