export interface SupabaseLikeClient {
  from: (table: string) => {
    select: (columns: string, options?: any) => Promise<{ data: any; error: any; count?: number }>;
    limit?: (count: number) => Promise<{ data: any; error: any; count?: number }>;
  };
}

const tableNameCache: Record<string, string> = {};

/**
 * Intenta resolver el nombre correcto de una tabla probando múltiples candidatos.
 * Cachea el resultado por clave para evitar consultas repetidas.
 */
export async function resolveTableName(
  supabase: SupabaseLikeClient,
  candidates: string[],
  cacheKey?: string
): Promise<string> {
  const key = cacheKey || candidates.join('|');
  if (tableNameCache[key]) return tableNameCache[key];

  for (const candidate of candidates) {
    const { error } = await supabase
      .from(candidate)
      .select('*', { head: true, count: 'exact' });

    if (!error) {
      tableNameCache[key] = candidate;
      return candidate;
    }

    const errMsg: string = error?.message || '';
    const errCode: string = error?.code || '';
    const relationMissing = errCode === '42P01' || /relation .* does not exist/i.test(errMsg);
    if (!relationMissing) {
      // Cualquier otro error (p.ej. permisos RLS) implica que la tabla existe
      tableNameCache[key] = candidate;
      return candidate;
    }
    // Probar siguiente candidato
  }

  // Fallback: primer candidato
  tableNameCache[key] = candidates[0];
  return candidates[0];
}

/**
 * Helper específico para Categorías. Prueba 'Category' y luego 'category'.
 */
export async function getCategoryTableName(supabase: SupabaseLikeClient): Promise<string> {
  return resolveTableName(supabase, ['Category', 'category'], 'Category|category');
}


