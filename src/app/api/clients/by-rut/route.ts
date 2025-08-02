import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rut = searchParams.get('rut');
    
    console.log('🔍 API Route: Buscando cliente por RUT:', rut);
    
    if (!rut) {
      return NextResponse.json({
        success: false,
        error: 'RUT requerido'
      });
    }

    const supabase = await getSupabaseServerClient();
    
    const { data: client, error } = await supabase
      .from('Client')
      .select(`
        *,
        contactos:ClientContact(
          id,
          nombre,
          apellido,
          email,
          telefono,
          telefonoMovil,
          cargo,
          departamento,
          tipoRelacionId,
          relacion,
          esContactoPrincipal,
          notas,
          fechaCreacion
        ),
        etiquetas:ClientTagAssignment(
          id,
          tag:ClientTag(
            id,
            nombre,
            color
          )
        )
      `)
      .eq('rut', rut)
      .single();

    if (error) {
      console.error('❌ Error obteniendo cliente por RUT:', error);
      return NextResponse.json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    console.log('✅ Cliente encontrado por RUT');
    
    return NextResponse.json({
      success: true,
      data: client
    });

  } catch (error: any) {
    console.error('❌ Error en API by-rut:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}