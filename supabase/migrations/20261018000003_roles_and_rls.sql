-- Roles internos y Row Level Security (defensa adicional).
-- El backend usa la service role key solo en servidor; el cliente anónimo
-- únicamente puede leer el catálogo público.

create type app_role as enum ('admin', 'receptionist', 'stylist');

create table app_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null,
  staff_id uuid unique references staff (id) on delete set null,
  created_at timestamptz not null default now(),
  check (role <> 'stylist' or staff_id is not null)
);

alter table locations enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table staff_services enable row level security;
alter table working_hours enable row level security;
alter table time_off enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table app_users enable row level security;

-- Catálogo público (solo lectura).
create policy "public read locations" on locations
  for select to anon, authenticated using (true);

create policy "public read active services" on services
  for select to anon, authenticated using (is_active);

create policy "public read active staff" on staff
  for select to anon, authenticated using (is_active);

create policy "public read staff_services" on staff_services
  for select to anon, authenticated using (true);

-- Administración y recepción: acceso total.
create policy "backoffice all locations" on locations
  for all to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')))
  with check (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')));

create policy "backoffice all services" on services
  for all to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')))
  with check (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')));

create policy "backoffice all staff" on staff
  for all to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')))
  with check (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')));

create policy "backoffice all staff_services" on staff_services
  for all to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')))
  with check (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')));

create policy "backoffice all working_hours" on working_hours
  for all to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')))
  with check (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')));

create policy "backoffice all time_off" on time_off
  for all to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')))
  with check (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')));

create policy "backoffice all customers" on customers
  for all to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')))
  with check (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')));

create policy "backoffice all appointments" on appointments
  for all to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')))
  with check (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role in ('admin', 'receptionist')));

-- Estilistas: solo lectura de su propia agenda.
create policy "stylist read own appointments" on appointments
  for select to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role = 'stylist' and u.staff_id = appointments.staff_id));

create policy "stylist read own working_hours" on working_hours
  for select to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role = 'stylist' and u.staff_id = working_hours.staff_id));

create policy "stylist read own time_off" on time_off
  for select to authenticated
  using (exists (select 1 from app_users u where u.user_id = auth.uid() and u.role = 'stylist' and u.staff_id = time_off.staff_id));

-- Cada usuario lee su propio rol. Los roles se gestionan solo desde el backend
-- (service role); una política que consulte app_users sobre sí misma causaría recursión.
create policy "read own app_user" on app_users
  for select to authenticated using (user_id = auth.uid());