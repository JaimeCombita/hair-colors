# SPEC técnico: Hair Colors

Especificación técnica de arquitectura y convenciones de código. Es la referencia obligatoria para cualquier cambio en el proyecto.

> Contexto funcional y de negocio: [README.md](./README.md). Tareas: [TASKS.md](./TASKS.md).

---

## 1. Principios

1. **Separación de responsabilidades.** Cada archivo tiene una sola razón para cambiar: *presentación*, *estilos*, *lógica de UI*, *lógica de negocio* o *acceso a datos*.
2. **Organización por dominio.** El código se agrupa por funcionalidad (`booking`, `catalog`...), no por tipo técnico.
3. **Reutilización con criterio.** Se extrae a `shared/` cuando algo se usa en **2 o más dominios**, o cuando es una primitiva sin conocimiento del negocio. Antes de eso vive en su dominio.
4. **Dependencias en una sola dirección** (ver §3), verificadas por ESLint.
5. **Funciones pequeñas y puras** siempre que sea posible. Los efectos secundarios (BD, red, email) viven solo en `infrastructure/` y en los adaptadores de `src/server/`.
6. **Monolito modular.** Cada módulo de negocio puede extraerse a un servicio independiente sin reescribirse.

---

## 2. Estructura de carpetas

```
hair-colors/
├─ src/
│  ├─ app/                      # RUTEO y composición. Solo páginas, layouts y route handlers delgados
│  │  ├─ (public)/              # landing, reserva, gestión de cita
│  │  ├─ (admin)/admin/         # panel autenticado
│  │  └─ api/                   # route handlers (capa de transporte HTTP)
│  │
│  ├─ features/                 # FRONTEND por dominio (UI + lógica de UI)
│  │  └─ <dominio>/
│  │     ├─ components/         # un componente por carpeta (ver §4)
│  │     ├─ hooks/              # lógica de UI con estado (use-*.ts)
│  │     ├─ actions/            # Server Actions delgadas ('use server')
│  │     ├─ lib/                # funciones puras de UI (formateo, mapeos)
│  │     └─ index.ts            # API pública del feature
│  │
│  ├─ modules/                  # BACKEND por dominio (lógica de negocio, sin Next.js)
│  │  └─ <dominio>/
│  │     ├─ domain/             # tipos, esquemas Zod, reglas puras, errores
│  │     ├─ application/        # casos de uso / servicios
│  │     ├─ infrastructure/     # repositorios (implementaciones con Supabase)
│  │     └─ index.ts            # API pública del módulo
│  │
│  ├─ shared/                   # REUTILIZABLE y sin lógica de negocio
│  │  ├─ ui/                    # primitivas visuales (Button, Input, Dialog...)
│  │  ├─ hooks/                 # hooks genéricos
│  │  ├─ lib/                   # utilidades puras (cn, fechas, result, errores)
│  │  ├─ config/                # constantes y configuración de solo lectura
│  │  └─ types/                 # tipos transversales
│  │
│  ├─ server/                   # INFRAESTRUCTURA compartida solo-servidor
│  │  ├─ db/                    # clientes de Supabase
│  │  ├─ email/                 # cliente Resend
│  │  ├─ env.ts                 # variables de entorno validadas con Zod
│  │  └─ auth/                  # guardas de sesión y roles
│  │
│  ├─ content/                  # TEXTOS y datos estáticos de la landing (sin JSX)
│  └─ styles/                   # tokens de diseño y CSS global
│
├─ supabase/
│  └─ migrations/               # SQL versionado
├─ tests/                       # pruebas e2e
├─ SPEC.md · README.md · TASKS.md
```

### Dominios previstos

| Dominio | Módulo (`modules/`) | Feature (`features/`) | Responsabilidad |
|---|---|---|---|
| `catalog` | ✔ | ✔ | Servicios (nombre, duración, precio) |
| `staff` | ✔ | ✔ | Estilistas, servicios que ofrecen, horarios, ausencias |
| `scheduling` | ✔ | ✔ (`booking`) | Disponibilidad y citas (crear, reprogramar, cancelar) |
| `customers` | ✔ | ✔ | Clientes e historial |
| `notifications` | ✔ | n/a | Email y WhatsApp, orquestados por eventos |
| `auth` | ✔ | ✔ | Login y roles del personal |
| `landing` | n/a | ✔ | Secciones de la landing (usa `content/`) |
| `payments`, `reports` | futuro | futuro | Fase posterior |

---

## 3. Reglas de dependencia

```
app ──► features ──► modules ──► shared
 │          │            │
 │          └────────────┴──► server ──► shared
 └──► shared
```

| Capa | Puede importar | NO puede importar |
|---|---|---|
| `shared/` | solo `shared/` | `features`, `modules`, `server`, `app` |
| `modules/` | `shared/`, `server/` (solo desde `infrastructure/`) | `features`, `app`, `next/*`, `react` |
| `server/` | `shared/` | `features`, `modules`, `app` |
| `features/` | `modules/` (solo vía su `index.ts`), `shared/` | otros `features/` (se comunican por `app/` o `shared/`), `server/` directo |
| `app/` | todas | n/a |

Dentro de `modules/<dominio>/`:

```
domain  ◄── application ◄── infrastructure
```
- `domain/` no importa nada de las demás capas.
- `application/` depende de `domain/` y de **interfaces de repositorio** definidas en `domain/`.
- `infrastructure/` implementa esas interfaces. La inyección se hace al componer el servicio en `index.ts`.

Un módulo solo se importa desde fuera por su `index.ts`. Importar archivos internos está prohibido.

Estas reglas se aplican con `no-restricted-imports` en [eslint.config.mjs](./eslint.config.mjs). ESLint bloquea: imports hacia capas superiores, `next`/`react` dentro de `modules/`, `server/` fuera de `infrastructure/`, imports profundos a módulos y features, y rutas relativas `../../`. La regla "un feature no importa a otro" se revisa en code review.

---

## 4. Frontend: componentes, lógica y estilos separados

Cada componente tiene su carpeta, y cada responsabilidad su archivo:

```
components/service-picker/
├─ service-picker.tsx          # PRESENTACIÓN: solo JSX, sin lógica ni clases largas
├─ service-picker.styles.ts    # ESTILOS: clases de Tailwind con cva
├─ use-service-picker.ts       # LÓGICA DE UI: estado, handlers (opcional)
├─ service-picker.logic.ts     # FUNCIONES PURAS: formateo, filtros (opcional)
├─ service-picker.test.tsx     # pruebas (opcional)
└─ index.ts                    # export público
```

| Archivo | Contiene | NO contiene |
|---|---|---|
| `*.tsx` | JSX, props tipadas, composición | `useState` complejo, `fetch`, reglas de negocio, strings de clases largas |
| `*.styles.ts` | `cva`/`cn`, variantes, clases de Tailwind | JSX, lógica |
| `use-*.ts` | Estado, efectos, llamadas a actions | JSX, estilos |
| `*.logic.ts` | Funciones puras y testeables | React, efectos |

### Estilos
- **Tokens de diseño** (colores, tipografía, radios, espaciados) en `src/styles/theme.css` mediante `@theme` de Tailwind v4. Nunca valores "mágicos" en componentes.
- **CSS global** únicamente en `src/styles/globals.css` (reset, base).
- **Clases de componente** en su `*.styles.ts`. El `.tsx` importa el resultado:

```ts
// button.styles.ts
export const button = cva("inline-flex items-center rounded-md font-medium", {
  variants: {
    intent: { primary: "bg-brand-600 text-white", ghost: "bg-transparent" },
    size: { sm: "h-8 px-3", md: "h-10 px-4" },
  },
  defaultVariants: { intent: "primary", size: "md" },
});
```
```tsx
// button.tsx
export function Button({ intent, size, className, ...props }: ButtonProps) {
  return <button className={cn(button({ intent, size }), className)} {...props} />;
}
```
- Un componente recibe `className` opcional y lo combina con `cn()` para poder extenderse.

### Reutilización de UI
- **`shared/ui/`**: primitivas sin conocimiento del negocio (`Button`, `Input`, `Select`, `Dialog`, `Calendar`...). shadcn/ui se instala aquí.
- **`features/<dominio>/components/`**: componentes con conocimiento del dominio, que componen primitivas de `shared/ui`.
- **Server Components por defecto.** `'use client'` solo en el componente que lo necesite, lo más abajo posible en el árbol.

### Contenido de la landing
Textos, listas de servicios destacados, datos de contacto, URLs de redes y SEO viven en `src/content/*.ts` como datos tipados. Los componentes de `features/landing` solo los renderizan.

---

## 5. Backend: capas y responsabilidades

### 5.1 Transporte (`app/api`, `features/*/actions`)
Delgado. Solo:
1. Lee y valida la entrada con el esquema Zod del módulo.
2. Verifica autenticación/autorización con `server/auth`.
3. Llama a **un** caso de uso.
4. Traduce el resultado o error a HTTP.

```ts
export async function POST(req: Request) {
  const input = createAppointmentSchema.parse(await req.json());
  const result = await schedulingService.createAppointment(input);
  return toHttpResponse(result);
}
```

### 5.2 Aplicación (`modules/<d>/application`)
Casos de uso. Orquestan reglas del dominio y repositorios. Una función por caso de uso (`createAppointment`, `getAvailability`, `cancelAppointment`). Sin acceso directo a Supabase ni a `Request`.

### 5.3 Dominio (`modules/<d>/domain`)
- `types.ts`: entidades y valores.
- `schemas.ts`: Zod (única fuente de verdad para validación y tipos de entrada).
- `rules.ts`: reglas **puras** (por ejemplo, cálculo de slots libres a partir de horarios, ausencias y citas).
- `errors.ts`: errores tipados del dominio.
- `repository.ts`: **interfaces** de persistencia.

### 5.4 Infraestructura (`modules/<d>/infrastructure`)
Implementaciones de repositorio con Supabase. Es el único lugar del módulo donde se conoce la BD. Mapea filas a entidades del dominio.

### 5.5 Manejo de errores
- Los casos de uso devuelven `Result<T, DomainError>` (`shared/lib/result.ts`) para errores esperados (conflicto de horario, cita inexistente).
- Las excepciones se reservan para fallos inesperados, que se capturan en el transporte y se reportan a Sentry.
- Un único traductor `toHttpResponse` mapea errores de dominio a códigos HTTP.

### 5.6 Eventos de dominio
Los módulos publican eventos (`AppointmentCreated`, `AppointmentCancelled`). `notifications` se suscribe. Inicialmente es un bus en memoria; si hace falta, se sustituye por una cola sin tocar `scheduling`.

---

## 6. API

### Públicos
| Endpoint | Método | Caso de uso |
|---|---|---|
| `/api/services` | GET | `catalog.listServices` |
| `/api/staff?serviceId=` | GET | `staff.listByService` |
| `/api/availability?serviceId=&staffId=&date=` | GET | `scheduling.getAvailability` |
| `/api/appointments` | POST | `scheduling.createAppointment` |
| `/api/appointments/[token]` | GET / PATCH / DELETE | `scheduling.get/reschedule/cancel` |

### Administración (requiere sesión y rol)
Server Actions por feature: servicios, estilistas, horarios, ausencias, agenda y clientes.

### Cron
`/api/cron/reminders`, `/api/cron/backup-ping`. Protegidos con `CRON_SECRET`.

### Convenciones
- Respuestas JSON: `{ data }` en éxito, `{ error: { code, message, details? } }` en fallo.
- Fechas en ISO 8601 UTC. La zona del salón (`America/Bogota`) se aplica **solo al presentar**, mediante `shared/lib/datetime.ts`.
- Los esquemas Zod de `domain/schemas.ts` generan el contrato OpenAPI cuando se necesite.

---

## 7. Base de datos

- PostgreSQL (Supabase), sin ORM. Migraciones SQL numeradas en `supabase/migrations/`.
- Tipos de TypeScript generados con Supabase CLI. Los repositorios mapean esos tipos a entidades de dominio, y el dominio **no** depende de los tipos generados.
- Tablas: `locations`, `services`, `staff`, `staff_services`, `working_hours`, `time_off`, `customers`, `appointments`.
- Integridad crítica en BD:
  ```sql
  EXCLUDE USING gist (staff_id WITH =, during WITH &&) WHERE (status <> 'cancelled')
  ```
- Sin lógica de negocio en triggers ni funciones SQL (solo constraints). Esto facilita la migración futura.
- RLS activo como defensa adicional. La autorización principal vive en el backend.
- Fechas `timestamptz` en UTC.

---

## 8. Seguridad

- Variables sensibles solo en servidor, validadas en `server/env.ts`. Solo las `NEXT_PUBLIC_*` llegan al cliente.
- Cloudflare Turnstile y rate limiting en `POST /api/appointments`.
- Token de gestión de cita firmado (HMAC) con expiración.
- Sin cuentas de cliente. Los datos personales se tratan según la Ley 1581 de 2012, con consentimiento explícito registrado (`consented_at`).
- Cabeceras de seguridad en `next.config.ts` (CSP, HSTS, X-Content-Type-Options).
- Las claves de servicio de Supabase nunca se usan en código de cliente.

---

## 9. Convenciones de código

| Tema | Regla |
|---|---|
| Nombres de archivo | `kebab-case` (`service-picker.tsx`). Hooks `use-*.ts` |
| Componentes | `PascalCase`, un componente exportado por archivo |
| Funciones | `camelCase`, verbo + objeto (`getAvailability`), una responsabilidad |
| Tamaño | Funciones ≤ ~40 líneas. Archivos ≤ ~200 líneas. Si crece, se divide |
| Exports | Exports con nombre. `export default` solo donde Next.js lo exige (`page`, `layout`, `route`) |
| Imports | Alias `@/`. Sin rutas relativas que suban más de un nivel (`../../`) |
| Tipos | `strict` activo. Sin `any`. Tipos de entrada inferidos de Zod |
| Comentarios | Solo donde la intención no sea evidente |
| Constantes | Sin números ni strings mágicos. Van en `shared/config` o en el dominio |
| Commits | Convencionales (`feat:`, `fix:`, `chore:`...) |

---

## 10. Pruebas

| Nivel | Qué | Dónde | Herramienta |
|---|---|---|---|
| Unitarias | Reglas puras del dominio (disponibilidad, tokens, fechas), `*.logic.ts` | junto al archivo (`*.test.ts`) | Vitest |
| Integración | Repositorios contra Postgres local | `modules/*/infrastructure` | Vitest + Supabase local |
| Componentes | Primitivas y componentes con lógica | junto al componente | Vitest + Testing Library |
| E2E | Flujo de reserva completo, panel admin | `tests/` | Playwright |

Prioridad: cubrir primero `scheduling/domain/rules.ts` (cálculo de disponibilidad y conflictos).

---

## 11. Entornos y despliegue

- Entornos: `local` (Supabase CLI), `preview` (por PR), `production`.
- `.env.example` documenta todas las variables. Los secretos no se versionan.
- Build en contenedor posible con `output: "standalone"`, para poder salir de Vercel sin cambios de código.
- CI: lint, typecheck, pruebas y build en cada PR.

---

## 12. Ejemplo de flujo: crear una cita

```
features/booking/components/booking-form        (presentación)
  └─ use-booking-form.ts                         (estado y envío)
       └─ features/booking/actions/create-appointment.ts   ('use server', delgada)
            ├─ valida con modules/scheduling/domain/schemas.ts
            └─ modules/scheduling/application/create-appointment.ts
                 ├─ domain/rules.ts              (valida slot y duración)
                 └─ infrastructure/appointment-repository.ts   (INSERT; la BD rechaza solapamientos)
                      └─ publica AppointmentCreated → notifications → email (Resend)
```
