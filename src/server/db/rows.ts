/** Filas tal como las devuelve PostgREST. Reemplazar por los tipos generados con `supabase gen types`. */
export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cop: number;
  is_active: boolean;
  sort_order: number;
}

export interface StaffRow {
  id: string;
  full_name: string;
  bio: string | null;
  photo_url: string | null;
}

export interface WorkingHoursRow {
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface RangeRow {
  during: string;
}

export interface IdRow {
  id: string;
}
