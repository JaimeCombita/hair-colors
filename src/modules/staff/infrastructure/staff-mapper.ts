import type { StaffRow } from "@/server/db/rows";
import type { Staff } from "../domain/types";

export function toStaff(row: StaffRow): Staff {
  return {
    id: row.id,
    fullName: row.full_name,
    bio: row.bio,
    photoUrl: row.photo_url,
  };
}
