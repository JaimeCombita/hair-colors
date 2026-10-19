import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdRow } from "@/server/db/rows";
import { unwrapOne } from "@/server/db/unwrap";
import type { CustomerRepository } from "../domain/repository";

export function createSupabaseCustomerRepository(getClient: () => SupabaseClient): CustomerRepository {
  return {
    async upsertByPhone(input) {
      const row = unwrapOne<IdRow>(
        await getClient()
          .from("customers")
          .upsert(
            {
              phone: input.phone,
              full_name: input.fullName,
              email: input.email,
              consented_at: input.consentedAt.toISOString(),
            },
            { onConflict: "phone" },
          )
          .select("id")
          .single(),
      );
      return { id: row.id };
    },
  };
}
