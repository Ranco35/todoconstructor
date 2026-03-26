import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Verifica autenticación en rutas API.
 * Retorna el user si está autenticado, o null si no.
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Respuesta estándar para rutas no autorizadas.
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'No autorizado' },
    { status: 401 }
  );
}
