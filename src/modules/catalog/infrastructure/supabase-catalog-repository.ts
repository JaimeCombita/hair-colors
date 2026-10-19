import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceRow } from "@/server/db/rows";
import { unwrapRows } from "@/server/db/unwrap";
import type { CatalogRepository } from "../domain/repository";
import { toService } from "./service-mapper";

const COLUMNS = "id, name, description, duration_minutes, price_cop, is_active, sort_order";

export function createSupabaseCatalogRepository(getClient: () => SupabaseClient): CatalogRepository {
  return {
    async listActiveServices() {
      const rows = unwrapRows<ServiceRow>(
        await getClient().from("services").select(COLUMNS).eq("is_active", true).order("sort_order"),
      );
      return rows.map(toService);
    },

    async findServiceById(id) {
      const rows = unwrapRows<ServiceRow>(await getClient().from("services").select(COLUMNS).eq("id", id).limit(1));
      return rows[0] ? toService(rows[0]) : null;
    },
  };
}
