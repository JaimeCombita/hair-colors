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
- [ ] Configurar Vitest y Testing Library
- [ ] Configurar `server/env.ts` (validación con Zod)
- [ ] Crear proyecto en Supabase y configurar Supabase CLI
- [ ] Registrar dominio (.com / .co)

## Fase 1: Base de datos
- [ ] Migración inicial: locations, services, staff, staff_services
- [ ] Migración: working_hours, time_off, customers
- [ ] Migración: appointments con exclusion constraint anti-solapamiento
- [ ] Políticas RLS (público solo lectura de catálogo; admin completo)
- [ ] Seeds de datos de ejemplo
- [ ] Generar tipos TypeScript

## Fase 2: Backend
- [ ] Endpoint de servicios
- [ ] Endpoint de estilistas por servicio
- [ ] Función de disponibilidad (horarios, ausencias, citas existentes, zona America/Bogota)
- [ ] Endpoint de creación de cita (Zod + Turnstile + manejo de conflicto)
- [ ] Token firmado para consultar/reprogramar/cancelar
- [ ] Rate limiting
- [ ] Envío de email de confirmación (Resend)

## Fase 3: Frontend público
- [ ] Landing: hero, servicios, galería, equipo, ubicación, contacto
- [ ] SEO local: metadatos, datos estructurados LocalBusiness, sitemap
- [ ] Flujo de reserva: servicio → estilista → fecha/hora → datos
- [ ] Casilla de autorización Habeas Data y política de privacidad
- [ ] Página de gestión de cita (cancelar/reprogramar)
- [ ] Diseño responsive y accesibilidad

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
