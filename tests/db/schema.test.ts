import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperuser, asUser, createMigratedDb } from "./helpers";

const STAFF_1 = "00000000-0000-0000-0000-0000000000c1";
const STAFF_2 = "00000000-0000-0000-0000-0000000000c2";
const SERVICE_CUT = "00000000-0000-0000-0000-0000000000b1";

let db: PGlite;
let customerId: string;

async function insertAppointment(staffId: string, start: string, end: string, status = "confirmed") {
  const cancelledAt = status === "cancelled" ? "now()" : "null";
  return db.query(
    `insert into appointments (staff_id, service_id, customer_id, during, status, cancelled_at)
     values ($1, $2, $3, tstzrange($4::timestamptz, $5::timestamptz), $6::appointment_status, ${cancelledAt})`,
    [staffId, SERVICE_CUT, customerId, start, end, status],
  );
}

beforeAll(async () => {
  db = await createMigratedDb({ seed: true });
  const res = await db.query<{ id: string }>(
    `insert into customers (full_name, phone, email, consented_at)
     values ('Ana Pérez', '+573001112233', 'ana@example.com', now()) returning id`,
  );
  customerId = res.rows[0].id;
});

afterAll(async () => {
  await db.close();
});

describe("appointments: anti-solapamiento", () => {
  it("rechaza una cita que se solapa con otra del mismo estilista", async () => {
    await insertAppointment(STAFF_1, "2026-11-02T15:00:00Z", "2026-11-02T16:00:00Z");
    await expect(
      insertAppointment(STAFF_1, "2026-11-02T15:30:00Z", "2026-11-02T16:30:00Z"),
    ).rejects.toThrow(/appointments_no_overlap/);
  });

  it("permite citas contiguas (fin == inicio)", async () => {
    await insertAppointment(STAFF_1, "2026-11-03T15:00:00Z", "2026-11-03T16:00:00Z");
    await expect(
      insertAppointment(STAFF_1, "2026-11-03T16:00:00Z", "2026-11-03T17:00:00Z"),
    ).resolves.toBeDefined();
  });

  it("permite el mismo horario con otro estilista", async () => {
    await insertAppointment(STAFF_1, "2026-11-04T15:00:00Z", "2026-11-04T16:00:00Z");
    await expect(
      insertAppointment(STAFF_2, "2026-11-04T15:00:00Z", "2026-11-04T16:00:00Z"),
    ).resolves.toBeDefined();
  });

  it("libera el horario cuando la cita se cancela", async () => {
    await insertAppointment(STAFF_1, "2026-11-05T15:00:00Z", "2026-11-05T16:00:00Z", "cancelled");
    await expect(
      insertAppointment(STAFF_1, "2026-11-05T15:00:00Z", "2026-11-05T16:00:00Z"),
    ).resolves.toBeDefined();
  });

  it("exige cancelled_at cuando el estado es cancelled", async () => {
    await expect(
      db.query(
        `insert into appointments (staff_id, service_id, customer_id, during, status)
         values ($1, $2, $3, tstzrange('2026-11-06T15:00Z', '2026-11-06T16:00Z'), 'cancelled')`,
        [STAFF_1, SERVICE_CUT, customerId],
      ),
    ).rejects.toThrow();
  });

  it("rechaza rangos vacíos", async () => {
    await expect(
      insertAppointment(STAFF_1, "2026-11-07T15:00:00Z", "2026-11-07T15:00:00Z"),
    ).rejects.toThrow();
  });
});

describe("restricciones de datos", () => {
  it("rechaza teléfonos que no estén en formato E.164", async () => {
    await expect(
      db.query(
        `insert into customers (full_name, phone, email, consented_at)
         values ('X', '3001112233', 'x@example.com', now())`,
      ),
    ).rejects.toThrow();
  });

  it("no permite dos clientes con el mismo teléfono", async () => {
    await expect(
      db.query(
        `insert into customers (full_name, phone, email, consented_at)
         values ('Otra', '+573001112233', 'otra@example.com', now())`,
      ),
    ).rejects.toThrow();
  });

  it("rechaza bloques de horario solapados para el mismo día", async () => {
    await expect(
      db.query(
        `insert into working_hours (staff_id, weekday, start_time, end_time)
         values ($1, 1, '11:00', '13:00')`,
        [STAFF_1],
      ),
    ).rejects.toThrow();
  });

  it("permite bloques consecutivos en el mismo día", async () => {
    await expect(
      db.query(
        `insert into working_hours (staff_id, weekday, start_time, end_time)
         values ($1, 7, '09:00', '12:00'), ($1, 7, '12:00', '14:00')`,
        [STAFF_1],
      ),
    ).resolves.toBeDefined();
  });

  it("rechaza duraciones de servicio que no sean múltiplo de 5", async () => {
    await expect(
      db.query(`insert into services (name, duration_minutes, price_cop) values ('Raro', 33, 1000)`),
    ).rejects.toThrow();
  });

  it("exige staff_id para el rol stylist", async () => {
    const { rows } = await db.query<{ id: string }>(`insert into auth.users default values returning id`);
    await expect(
      db.query(`insert into app_users (user_id, role) values ($1, 'stylist')`, [rows[0].id]),
    ).rejects.toThrow();
  });
});

describe("RLS", () => {
  it("el rol anónimo lee solo servicios activos y no ve clientes ni citas", async () => {
    await asSuperuser(db);
    await db.exec(
      `insert into services (name, duration_minutes, price_cop, is_active) values ('Inactivo', 30, 1000, false)`,
    );
    await asUser(db, "anon");

    const services = await db.query<{ name: string }>("select name from services");
    expect(services.rows.map((r) => r.name)).not.toContain("Inactivo");
    expect(services.rows.length).toBeGreaterThan(0);

    expect((await db.query("select 1 from customers")).rows).toHaveLength(0);
    expect((await db.query("select 1 from appointments")).rows).toHaveLength(0);
    await expect(
      db.query(`insert into services (name, duration_minutes, price_cop) values ('X', 30, 1)`),
    ).rejects.toThrow();
    await asSuperuser(db);
  });

  it("recepción ve todo; un estilista solo ve su agenda", async () => {
    await asSuperuser(db);
    const receptionist = (await db.query<{ id: string }>(`insert into auth.users default values returning id`)).rows[0].id;
    const stylist = (await db.query<{ id: string }>(`insert into auth.users default values returning id`)).rows[0].id;
    await db.query(`insert into app_users (user_id, role) values ($1, 'receptionist')`, [receptionist]);
    await db.query(`insert into app_users (user_id, role, staff_id) values ($1, 'stylist', $2)`, [stylist, STAFF_2]);

    await asUser(db, "authenticated", receptionist);
    const all = await db.query<{ staff_id: string }>("select distinct staff_id from appointments");
    expect(all.rows.map((r) => r.staff_id).sort()).toEqual([STAFF_1, STAFF_2]);
    expect((await db.query("select 1 from customers")).rows.length).toBeGreaterThan(0);

    await asUser(db, "authenticated", stylist);
    const own = await db.query<{ staff_id: string }>("select distinct staff_id from appointments");
    expect(own.rows.map((r) => r.staff_id)).toEqual([STAFF_2]);
    expect((await db.query("select 1 from customers")).rows).toHaveLength(0);
    await asSuperuser(db);
  });
});
