import "server-only";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { createSupabaseCustomerRepository } from "./supabase-customer-repository";

const customers = createSupabaseCustomerRepository(getSupabaseAdmin);

export const customersService = {
  upsertByPhone: customers.upsertByPhone,
};
