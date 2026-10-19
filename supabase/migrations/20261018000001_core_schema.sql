-- Esquema base: catálogo, personal y disponibilidad.
-- Solo constraints de integridad; las reglas de negocio viven en la aplicación (SPEC.md §7).

create extension if not exists btree_gist;

create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  timezone text not null default 'America/Bogota',
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes % 5 = 0),
  price_cop integer not null check (price_cop >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations (id),
  full_name text not null,
  bio text,
  photo_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index staff_location_id_idx on staff (location_id);

create table staff_services (
  staff_id uuid not null references staff (id) on delete cascade,
  service_id uuid not null references services (id) on delete cascade,
  primary key (staff_id, service_id)
);
create index staff_services_service_id_idx on staff_services (service_id);

-- weekday ISO: 1 = lunes ... 7 = domingo. Hora local del salón.
-- Varios bloques por día (por ejemplo, descanso al mediodía) sin solaparse.
create table working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time),
  exclude using gist (
    staff_id with =,
    weekday with =,
    int4range(
      (extract(hour from start_time) * 60 + extract(minute from start_time))::int,
      (extract(hour from end_time) * 60 + extract(minute from end_time))::int
    ) with &&
  )
);

-- Ausencias, vacaciones o bloqueos puntuales. Rango en UTC.
create table time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff (id) on delete cascade,
  during tstzrange not null,
  reason text,
  check (not isempty(during) and not lower_inf(during) and not upper_inf(during))
);
create index time_off_staff_during_idx on time_off using gist (staff_id, during);
