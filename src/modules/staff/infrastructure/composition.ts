import "server-only";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { listStaffByService, staffOffersService } from "../application/staff-queries";
import { createSupabaseStaffRepository } from "./supabase-staff-repository";

const deps = { staff: createSupabaseStaffRepository(getSupabaseAdmin) };

export const staffService = {
  listByService: (serviceId: string) => listStaffByService(deps, serviceId),
  offersService: (staffId: string, serviceId: string) => staffOffersService(deps, staffId, serviceId),
};
