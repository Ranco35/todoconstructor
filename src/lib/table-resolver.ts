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

  let successful: string | null = null;
  for (const candidate of candidates) {
    const { error } = await supabase
      .from(candidate)
      .select('*', { head: true, count: 'exact' });

    if (!error) {
      successful = candidate;
      break;
    }

    const errMsg: string = error?.message || '';
    const errCode: string = error?.code || '';
    const relationMissing = errCode === '42P01' || /relation .* does not exist/i.test(errMsg);
    if (relationMissing) {
      continue;
    }
    // Si no es relación inexistente, no asumimos existencia; probamos siguiente
  }

  if (successful) {
    tableNameCache[key] = successful;
    return successful;
  }

  // Fallback preferente: minúsculas si está en la lista
  const fallback = candidates.includes('category') ? 'category' : candidates[0];
  tableNameCache[key] = fallback;
  return fallback;
}

/**
 * Helper específico para Categorías. Prueba 'Category' y luego 'category'.
 */
export async function getCategoryTableName(supabase: SupabaseLikeClient): Promise<string> {
  return resolveTableName(supabase, ['Category', 'category'], 'Category|category');
}


