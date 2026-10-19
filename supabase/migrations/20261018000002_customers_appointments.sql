-- Clientes y citas.

create type appointment_status as enum (
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

create type payment_status as enum (
  'not_required',
  'pending',
  'paid',
  'refunded'
);

-- Los clientes no tienen cuenta: se identifican por celular (E.164).
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consented_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff (id),
  service_id uuid not null references services (id),
  customer_id uuid not null references customers (id),
  during tstzrange not null,
  status appointment_status not null default 'confirmed',
  payment_status payment_status not null default 'not_required',
  notes text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not isempty(during) and not lower_inf(during) and not upper_inf(during)),
  check ((status = 'cancelled') = (cancelled_at is not null)),
  -- Garantiza en BD que un estilista no tenga dos citas activas solapadas.
  constraint appointments_no_overlap exclude using gist (
    staff_id with =,
    during with &&
  ) where (status <> 'cancelled')
);

create index appointments_staff_during_idx on appointments using gist (staff_id, during);
create index appointments_customer_id_idx on appointments (customer_id);
create index appointments_service_id_idx on appointments (service_id);
