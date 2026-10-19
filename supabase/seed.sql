-- Datos de ejemplo para desarrollo local. No usar en producción.

insert into locations (id, name, address) values
  ('00000000-0000-0000-0000-0000000000a1', 'Hair Colors Bogotá', 'Bogotá, Colombia');

insert into services (id, name, description, duration_minutes, price_cop, sort_order) values
  ('00000000-0000-0000-0000-0000000000b1', 'Corte', 'Corte y peinado', 45, 50000, 1),
  ('00000000-0000-0000-0000-0000000000b2', 'Color completo', 'Tinte y tratamiento', 120, 180000, 2),
  ('00000000-0000-0000-0000-0000000000b3', 'Manicure', 'Manicure tradicional', 60, 35000, 3);

insert into staff (id, location_id, full_name, sort_order) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Estilista Uno', 1),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', 'Estilista Dos', 2);

insert into staff_services (staff_id, service_id) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b2'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b3');

-- Lunes a sábado, 9:00-12:00 y 14:00-18:00.
insert into working_hours (staff_id, weekday, start_time, end_time)
select s.id, d, t.start_time, t.end_time
from staff s
cross join generate_series(1, 6) as d
cross join (values ('09:00'::time, '12:00'::time), ('14:00'::time, '18:00'::time)) as t (start_time, end_time);
