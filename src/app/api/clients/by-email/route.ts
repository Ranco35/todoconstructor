import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/clients/by-email?email=...
 * Búsqueda de cliente por email (insensible a mayúsculas/minúsculas).
 * Usada como fallback cuando la búsqueda general no encuentra por email.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Búsqueda insensible a mayúsculas usando ilike
    const { data: clients, error } = await supabase
      .from('Client')
      .select(`
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
      `)
      .ilike('email', email)
      .limit(5);

    if (error) {
      console.error('❌ [by-email] Error buscando cliente por email:', error);
      return NextResponse.json({ success: false, error: 'Error al buscar cliente' }, { status: 500 });
    }

    if (clients && clients.length > 0) {
      return NextResponse.json({ success: true, data: clients[0] });
    }

    return NextResponse.json({ success: false, error: 'Cliente no encontrado' });
  } catch (error: any) {
    console.error('❌ [by-email] Error interno:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno' }, { status: 500 });
  }
}
