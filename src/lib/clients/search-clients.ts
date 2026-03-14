import 'server-only';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { normalizeRutDigits, buildRutSearchCandidates } from '@/lib/rut';

export interface SearchClientsParams {
  term: string;
  limit?: number;
  includeInactive?: boolean;
  minDigitsForRut?: number;
}

export interface SearchClientRow {
  id: number;
  tipoCliente: string;
  nombrePrincipal: string;
  apellido: string;
  razonSocial: string;
  rut: string;
  email: string;
  telefono: string;
  telefonoMovil: string;
  calle: string;
  ciudad: string;
  region: string;
  estado: string;
}

export interface SearchClientsResult {
  success: boolean;
  data?: SearchClientRow[];
  error?: string;
}

const CLIENT_SELECT_FIELDS = `
  id,
  "tipoCliente",
  "nombrePrincipal",
  "apellido",
  "razonSocial",
  "rut",
  "email",
  "telefono",
  "telefonoMovil",
  "calle",
  "ciudad",
  "region",
  "estado"
`;

async function searchClientsFallback({
  term,
  limit,
  includeInactive,
  digits,
  minDigitsForRut
}: {
  term: string;
  limit: number;
  includeInactive: boolean;
  digits: string;
  minDigitsForRut: number;
}): Promise<SearchClientsResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const trimmed = term.trim();

    // Intentar RPC unaccent primero
    const { data: ids, error: rpcError } = await supabase.rpc('get_client_ids_search_unaccent', {
      search_term: trimmed,
      p_limit: limit,
      p_include_inactive: includeInactive
    });

    if (!rpcError && ids && Array.isArray(ids) && ids.length > 0) {
      const idList = (ids as { id: number }[]).map((r) => r.id).slice(0, limit);
      const { data, error } = await supabase
        .from('Client')
        .select(CLIENT_SELECT_FIELDS)
        .in('id', idList)
        .order('nombrePrincipal', { ascending: true });
      if (!error && data) {
        return { success: true, data: data as SearchClientRow[] };
      }
    }

    // Fallback con ilike
    const rutCandidates = digits.length >= minDigitsForRut ? buildRutSearchCandidates(trimmed) : [trimmed];
    const orParts = [
      `nombrePrincipal.ilike.%${trimmed}%`,
      `apellido.ilike.%${trimmed}%`,
      `razonSocial.ilike.%${trimmed}%`,
      `email.ilike.%${trimmed}%`,
      `telefono.ilike.%${trimmed}%`,
      `telefonoMovil.ilike.%${trimmed}%`,
      ...rutCandidates.map((c) => `rut.eq.${c}`),
      `rut.ilike.%${trimmed}%`
    ].filter(Boolean);

    let query = supabase
      .from('Client')
      .select(CLIENT_SELECT_FIELDS)
      .order('nombrePrincipal', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('estado', 'activo');
    }

    const { data, error } = await query.or(orParts.join(','));
    if (error) {
      console.error('Error en searchClientsFallback:', error);
      return { success: false, error: 'Error al buscar clientes', data: [] };
    }

    return { success: true, data: (data as SearchClientRow[]) || [] };
  } catch (error) {
    console.error('Error en searchClientsFallback:', error);
    return { success: false, error: 'Error interno del servidor', data: [] };
  }
}

export async function searchClientsServer({
  term,
  limit = 20,
  includeInactive = false,
  minDigitsForRut = 6
}: SearchClientsParams): Promise<SearchClientsResult> {
  try {
    const raw = term || '';
    const trimmed = raw.trim();
    const digits = normalizeRutDigits(raw);
    const useDigits = digits.length >= minDigitsForRut;

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.rpc('search_clients', {
      term: trimmed,
      limit_count: limit,
      include_inactive: includeInactive,
      digits: useDigits ? digits : null
    });

    if (error) {
      console.error('Error en searchClientsServer (RPC):', error);
      return await searchClientsFallback({
        term: trimmed,
        limit,
        includeInactive,
        digits,
        minDigitsForRut
      });
    }

    return { success: true, data: (data as SearchClientRow[]) || [] };
  } catch (error) {
    console.error('Error en searchClientsServer:', error);
    return await searchClientsFallback({
      term: term || '',
      limit,
      includeInactive,
      digits: normalizeRutDigits(term || ''),
      minDigitsForRut
    });
  }
}
