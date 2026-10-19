import type { Customer, UpsertCustomerInput } from "./types";

export interface CustomerRepository {
  /** Crea el cliente o actualiza sus datos si ya existe un cliente con ese teléfono. */
  upsertByPhone(input: UpsertCustomerInput): Promise<Customer>;
}
