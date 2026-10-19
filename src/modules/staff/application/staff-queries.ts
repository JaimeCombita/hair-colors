import type { StaffRepository } from "../domain/repository";
import type { Staff } from "../domain/types";

export interface StaffDeps {
  staff: StaffRepository;
}

export function listStaffByService({ staff }: StaffDeps, serviceId: string): Promise<Staff[]> {
  return staff.listActiveByService(serviceId);
}

export function staffOffersService(
  { staff }: StaffDeps,
  staffId: string,
  serviceId: string,
): Promise<boolean> {
  return staff.offersService(staffId, serviceId);
}
