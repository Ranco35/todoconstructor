'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CONFIG, ConnectivityError } from './connectivity-utils';

// Función para crear cliente de Supabase con configuración robusta
async function createRobustSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { get: (name) => cookieStore.get(name)?.value },
      global: {
        fetch: (url, init) => {
          // Agregar timeout personalizado a todas las requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), CONFIG.defaultTimeout);
          
          return fetch(url, {
            ...init,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));
        }
      }
    }
  );
}

// Función utilitaria para ejecutar operaciones con reintentos
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    attempts?: number;
    delay?: number;
    timeout?: number;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const { 
    attempts = CONFIG.retryAttempts,
    delay = CONFIG.retryDelay,
    timeout = CONFIG.defaultTimeout,
    errorMessage = 'Error de conectividad con la base de datos'
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // Ejecutar la operación con timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);

      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Log del intento fallido
      console.warn(`Intento ${attempt}/${attempts} falló:`, error);

      // Si es el último intento, lanzar error
      if (attempt === attempts) {
        break;
      }

      // Calcular delay con backoff exponencial
      const currentDelay = Math.min(delay * Math.pow(2, attempt - 1), CONFIG.maxRetryDelay);
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  const isConnectivityError = lastError.message.includes('fetch failed') ||
                             lastError.message.includes('Connect Timeout') ||
                             lastError.message.includes('Timeout') ||
                             lastError.message.includes('ECONNRESET') ||
                             lastError.message.includes('ENOTFOUND');

  if (isConnectivityError) {
    throw new ConnectivityError(errorMessage, lastError);
  }

  throw lastError;
}

// Cliente robusto para server actions
export async function getRobustSupabaseClient() {
  return withRetry(
    async () => await createRobustSupabaseClient(),
    { 
      attempts: 2,
      timeout: 5000,
      errorMessage: 'No se pudo establecer conexión con la base de datos'
    }
  );
}

// Función específica para obtener proveedores con manejo robusto
export async function getRobustSupplier(supplierId: number) {
  return withRetry(
    async () => {
      const supabase = await createRobustSupabaseClient();
      
      const { data: supplier, error } = await supabase
        .from('Supplier')
        .select(`
          *,
          etiquetas:SupplierTagAssignment(
            id,
            etiquetaId,
            etiqueta:SupplierTag(
              id,
              nombre,
              color,
              icono,
              activo
            )
          )
        `)
        .eq('id', supplierId)
        .single();

      if (error) throw error;
      return supplier;
    },
    {
      attempts: 3,
      timeout: 15000,
      errorMessage: `No se pudo obtener la información del proveedor ${supplierId}`
    }
  );
}

// Función específica para obtener contactos con manejo robusto
export async function getRobustSupplierContacts(params: {
  supplierId: number;
  page: number;
  limit: number;
  filters: any;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) {
  return withRetry(
    async () => {
      const supabase = await createRobustSupabaseClient();
      
      // Verificar que el proveedor existe
      const { data: supplier, error: supplierError } = await supabase
        .from('Supplier')
        .select('id')
        .eq('id', params.supplierId)
        .single();

      if (supplierError || !supplier) {
        throw new Error('Proveedor no encontrado');
      }

      // Construir consulta base
      let query = supabase
        .from('SupplierContact')
        .select(`
          *,
          Supplier (
            id,
            name,
            businessName,
            reference,
            companyType
          )
        `)
        .eq('supplierId', params.supplierId);

      // Aplicar filtros
      if (params.filters.search) {
        const searchTerm = params.filters.search.trim();
        query = query.or(`name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,mobile.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      if (params.filters.type) {
        query = query.eq('type', params.filters.type);
      }

      if (params.filters.active !== undefined) {
        query = query.eq('active', params.filters.active);
      }

      // Calcular rango para paginación
      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;

      // Aplicar ordenamiento
      query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });

      // Obtener contactos con paginación
      const { data: contacts, error, count } = await query
        .range(from, to)
        .select('*', { count: 'exact' });

      if (error) {
        throw new Error(`Error obteniendo contactos: ${error.message}`);
      }

      return {
        data: contacts || [],
        stats: {
          total: count || 0,
          active: 0,
          inactive: 0,
          primary: 0,
          phone: 0,
          email: 0
        }
      };
    },
    {
      attempts: 3,
      timeout: 15000,
      errorMessage: `No se pudieron obtener los contactos del proveedor ${params.supplierId}`
    }
  );
}

// Función para verificar estado de conectividad
export async function checkConnectivity(): Promise<boolean> {
  try {
    await withRetry(
      async () => {
        const supabase = await createRobustSupabaseClient();
        const { error } = await supabase.from('Supplier').select('count').limit(1);
        if (error) throw error;
        return true;
      },
      { attempts: 2, timeout: 5000 }
    );
    return true;
  } catch {
    return false;
  }
} 