/** Falla con el mensaje de PostgREST; los errores esperados se manejan antes de llamar a esta función. */
export function unwrapRows<T>(result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

export function unwrapOne<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("La consulta no devolvió datos.");
  return result.data;
}

export const PG_EXCLUSION_VIOLATION = "23P01";
