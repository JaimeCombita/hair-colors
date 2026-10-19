export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCop: number;
  isActive: boolean;
  sortOrder: number;
}
