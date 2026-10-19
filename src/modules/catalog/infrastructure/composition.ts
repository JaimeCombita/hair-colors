import "server-only";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { getService, listServices } from "../application/catalog-queries";
import { createSupabaseCatalogRepository } from "./supabase-catalog-repository";

const deps = { catalog: createSupabaseCatalogRepository(getSupabaseAdmin) };

export const catalogService = {
  listServices: () => listServices(deps),
  getService: (id: string) => getService(deps, id),
};
