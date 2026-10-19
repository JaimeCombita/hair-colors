import type { RangeRow, WorkingHoursRow } from "@/server/db/rows";
import { parseTstzrange } from "@/server/db/tstzrange";
import type { TimeInterval, WorkingBlock } from "../domain/types";

export function toWorkingBlock(row: WorkingHoursRow): WorkingBlock {
  return { weekday: row.weekday, startTime: row.start_time, endTime: row.end_time };
}

export function toInterval(row: RangeRow): TimeInterval {
  return parseTstzrange(row.during);
}
