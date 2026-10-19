/** Intervalo semiabierto [start, end) en instantes UTC. */
export interface TimeInterval {
  start: Date;
  end: Date;
}

/** Bloque de horario laboral en hora local del salón. weekday ISO: 1 = lunes ... 7 = domingo. */
export interface WorkingBlock {
  weekday: number;
  startTime: string;
  endTime: string;
}

export type AppointmentStatus = "confirmed" | "completed" | "cancelled" | "no_show";

export interface BookableService {
  id: string;
  durationMinutes: number;
  isActive: boolean;
}
