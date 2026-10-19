import type { ServiceRow } from "@/server/db/rows";
import type { Service } from "../domain/types";

export function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceCop: row.price_cop,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}
