# Hair Colors

Landing page y sistema de agendamiento de citas para un salón de belleza en Bogotá, Colombia.

## Contexto del negocio
- 1 sede (Bogotá), ~10 estilistas, ~10 citas/día por estilista (~100 citas/día, ~3.000/mes).
- Los clientes reservan sin crear cuenta (nombre, celular +57, email).
- Sin pagos en línea en el MVP (se dejan preparados para una fase posterior).
- Presupuesto de infraestructura inicial mínimo.

## Arquitectura
**Monolito full-stack serverless en un único repositorio** (no es un monorepo de múltiples paquetes): frontend y backend viven en la misma aplicación Next.js.

```
Navegador ─► CDN (landing estática)
          └► Next.js (App Router)
                 ├─ Server Actions / Route Handlers (lógica de negocio)
                 ├─ Supabase Postgres (datos) + Auth (admin/estilistas)
                 ├─ Resend (email)
                 └─ WhatsApp (wa.me al inicio, Cloud API después)
Cron diario: recordatorios + backup (pg_dump) + ping a Supabase
```

## Stack
| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js (App Router), TypeScript, Tailwind, shadcn/ui |
| Base de datos | PostgreSQL (Supabase) |
| Acceso a datos | Cliente de Supabase + SQL/migraciones (Supabase CLI); tipos generados; Zod para validación |
| Auth | Supabase Auth (solo personal interno) |
| Email | Resend |
| Anti-spam | Cloudflare Turnstile |
| Hosting | Cloudflare Pages o Vercel (Pro si es uso comercial) |
| Monitoreo | Sentry + analítica del hosting |

## Backend: operaciones y endpoints

### Públicos (clientes)
| Operación | Método | Descripción |
|---|---|---|
| `/api/services` | GET | Catálogo de servicios (duración, precio) |
| `/api/staff?serviceId=` | GET | Estilistas que ofrecen un servicio |
| `/api/availability?serviceId=&staffId=&date=` | GET | Horarios libres calculados |
| `/api/appointments` | POST | Crea una cita (valida Turnstile y Zod) |
| `/api/appointments/[token]` | GET / PATCH / DELETE | Consultar, reprogramar o cancelar con token firmado |

### Administración (autenticado)
| Operación | Descripción |
|---|---|
| CRUD de servicios | Nombre, duración, precio, activo |
| CRUD de estilistas | Datos, servicios que ofrece |
| Horarios y ausencias | `working_hours`, `time_off` |
| Agenda | Ver/crear/mover/cancelar citas, estados (confirmada, completada, no-show) |
| Clientes | Listado e historial |

### Tareas programadas
- Recordatorios 24 h antes.
- Backup `pg_dump`.
- Ping para evitar pausa del plan gratuito de Supabase.

Se pueden implementar como Server Actions (formularios del panel) y Route Handlers (endpoints públicos y cron).

## Base de datos
No se usa JPA ni un ORM pesado: JPA es de Java y aquí el stack es TypeScript. Se usa **Postgres con migraciones SQL versionadas** y el cliente de Supabase con tipos generados. Motivos:
- Las reglas críticas (no solapar citas) se garantizan **en la BD** con una *exclusion constraint*.
- Se aprovecha Row Level Security para proteger datos.
- Alternativa válida si se prefiere un ORM: Drizzle ORM (ligero, cercano a SQL).

### Modelo
`locations` · `services` · `staff` · `staff_services` · `working_hours` · `time_off` · `customers` · `appointments`

`appointments`: `staff_id`, `service_id`, `customer_id`, `during tstzrange`, `status`, `payment_status`, `token`.

```sql
EXCLUDE USING gist (staff_id WITH =, during WITH &&) WHERE (status <> 'cancelled')
```

Zona horaria del salón: `America/Bogota`; se guarda en UTC (`timestamptz`).

## Costos estimados
| Etapa | Costo/mes aprox. |
|---|---|
| Lanzamiento (planes gratuitos + dominio ~12–25 USD/año) | ~0 USD |
| Operación estable (hosting Pro + Supabase Pro + Resend Pro) | ~65 USD |
| WhatsApp Cloud API (opcional) | Según tarifas vigentes de Meta |

Limitaciones a vigilar: Vercel Hobby no permite uso comercial; Supabase Free pausa por inactividad y no incluye backups diarios; Resend Free limita a 100 emails/día.

## Cumplimiento
Ley 1581 de 2012 (Habeas Data): autorización de tratamiento de datos y política de privacidad visibles en el formulario de reserva.

## Estructura prevista
Resumen. El detalle completo, las reglas de dependencia y las convenciones están en [SPEC.md](./SPEC.md).

```
hair-colors/
├─ src/
│  ├─ app/        # ruteo y composición (páginas, layouts, route handlers delgados)
│  ├─ features/   # frontend por dominio: components/, hooks/, actions/, lib/
│  ├─ modules/    # backend por dominio: domain/, application/, infrastructure/
│  ├─ shared/     # reutilizable sin lógica de negocio: ui/, hooks/, lib/, config/
│  ├─ server/     # infraestructura solo-servidor: db/, email/, auth/, env
│  ├─ content/    # textos y datos estáticos de la landing
│  └─ styles/     # tokens de diseño (theme.css) y CSS global
├─ supabase/migrations/
├─ tests/
├─ SPEC.md · README.md · TASKS.md
```

Cada componente separa presentación (`.tsx`), estilos (`.styles.ts`) y lógica (`use-*.ts` / `*.logic.ts`).

## Desarrollo
```bash
npm install
cp .env.example .env.local   # completar variables
npm run dev                  # http://localhost:3000
npm run lint
npm run build
```

## Documentación
- [SPEC.md](./SPEC.md): especificación técnica y convenciones.
- [TASKS.md](./TASKS.md): tareas por hacer.
