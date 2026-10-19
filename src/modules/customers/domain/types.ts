export interface UpsertCustomerInput {
  fullName: string;
  /** Formato E.164. */
  phone: string;
  email: string;
  consentedAt: Date;
}

export interface Customer {
  id: string;
}
