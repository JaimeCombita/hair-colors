import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

const SUPABASE_DIR = join(process.cwd(), "supabase");

// Imita lo mínimo de Supabase que usan las migraciones: auth.users, auth.uid() y los roles.
const SUPABASE_STUB = `
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid());
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;

export async function createMigratedDb({ seed = false } = {}): Promise<PGlite> {
  const db = new PGlite({ extensions: { btree_gist } });
  await db.exec(SUPABASE_STUB);

  const migrationsDir = join(SUPABASE_DIR, "migrations");
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  }
  if (seed) {
    await db.exec(readFileSync(join(SUPABASE_DIR, "seed.sql"), "utf8"));
  }
  return db;
}

export async function asUser(db: PGlite, role: "anon" | "authenticated", uid?: string) {
  await db.exec(`reset role; set role ${role};`);
  await db.query("select set_config('test.uid', $1, false)", [uid ?? ""]);
}

export async function asSuperuser(db: PGlite) {
  await db.exec("reset role;");
}
