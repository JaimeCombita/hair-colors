# Tareas por hacer

## Fase 0: Preparación
- [x] Crear repositorio Git (local)
- [ ] Subir el repositorio a GitHub
- [x] Inicializar Next.js + TypeScript + Tailwind
- [x] Definir [SPEC.md](./SPEC.md) (arquitectura y convenciones)
- [x] Estructura de carpetas por dominio y patrón de componentes (Button, Hero de referencia)
- [x] Reglas ESLint de dependencia entre capas
- [x] `.env.example`
- [ ] Instalar shadcn/ui configurando los alias hacia `src/shared/ui`
- [ ] Configurar Prettier
- [x] Configurar Vitest (pendiente Testing Library para componentes)
- [ ] Configurar `server/env.ts` (validación con Zod)
- [ ] Crear proyecto en Supabase y configurar Supabase CLI
- [ ] Registrar dominio (.com / .co)

## Fase 1: Base de datos
- [x] Migración inicial: locations, services, staff, staff_services
- [x] Migración: working_hours, time_off, customers
- [x] Migración: appointments con exclusion constraint anti-solapamiento
- [x] Políticas RLS (público solo lectura de catálogo; admin/recepción completo; estilista solo su agenda)
- [x] Seeds de datos de ejemplo
- [x] Pruebas de migraciones, constraints y RLS (PGlite)
- [ ] Aplicar migraciones al proyecto Supabase y verificar con Supabase CLI
- [ ] Generar tipos TypeScript

## Fase 2: Backend
- [x] Reglas de disponibilidad (horarios, ausencias, citas existentes, zona America/Bogota) con pruebas
- [x] Esquemas Zod de consulta de disponibilidad y creación de cita
- [x] Caso de uso `getAvailability` con puertos de repositorio y catálogo
- [ ] Repositorio de scheduling con Supabase (`infrastructure/`)
- [ ] Módulos `catalog` y `staff`: dominio, casos de uso y repositorios
- [ ] Adaptador `ServiceCatalogReader` sobre el módulo catalog
- [ ] Endpoint de servicios
- [ ] Endpoint de estilistas por servicio
- [ ] Endpoint de disponibilidad
- [ ] Caso de uso `createAppointment` (upsert de cliente, validación de slot, manejo del conflicto de la constraint)
- [ ] Endpoint de creación de cita (Zod + Turnstile + manejo de conflicto)
- [ ] Token firmado para consultar/reprogramar/cancelar
- [ ] Rate limiting
- [ ] Envío de email de confirmación (Resend)

## Fase 2.5: Identidad visual y diseño (en paralelo con Fases 1-2)
- [ ] Definir identidad: logo, paleta, tipografías y tono (ver SPEC §13)
- [ ] Moodboard y referentes de salones
- [ ] Recopilar fotografía real del salón, equipo y trabajos
- [ ] Wireframes (móvil primero): landing, reserva, gestión de cita, panel admin
- [ ] Prototipo en Figma y validación con el salón
- [ ] Traducir paleta y tipografía a tokens en `src/styles/theme.css`
- [ ] Reemplazar la paleta provisional
- [ ] Primitivas de `shared/ui` sobre los tokens (input, select, selector de fecha/hora, tarjeta, diálogo)
- [ ] Optimizar imágenes y favicon/íconos en `public/`

## Fase 3: Frontend público
- [ ] Landing: hero, servicios, galería, equipo, ubicación, contacto
- [ ] SEO local: metadatos, datos estructurados LocalBusiness, sitemap
- [ ] Flujo de reserva: servicio → estilista → fecha/hora → datos
- [ ] Casilla de autorización Habeas Data y política de privacidad
- [ ] Página de gestión de cita (cancelar/reprogramar)
- [ ] Diseño responsive (mobile-first) y accesibilidad WCAG AA, según SPEC §13

## Fase 4: Panel de administración
- [ ] Login (Supabase Auth)
- [ ] CRUD de servicios
- [ ] CRUD de estilistas, horarios y ausencias
- [ ] Agenda diaria/semanal por estilista
- [ ] Gestión de citas (crear, mover, cancelar, no-show)
- [ ] Listado de clientes

## Fase 5: Operación y lanzamiento
- [ ] Cron de recordatorios 24 h antes
- [ ] Backup programado (pg_dump) y ping a Supabase
- [ ] Sentry y analítica
- [ ] Pruebas (unitarias de disponibilidad, e2e del flujo de reserva)
- [ ] Despliegue, dominio y SSL
- [ ] Perfil de Google Business
- [ ] Prueba piloto con el personal

## Fase 6: Futuro
- [ ] WhatsApp Cloud API con plantillas
- [ ] Pagos en línea / anticipos (Wompi, Mercado Pago o ePayco)
- [ ] Sincronización con Google Calendar
- [ ] Reportes (ocupación, ingresos por estilista)
- [ ] Fidelización y promociones
