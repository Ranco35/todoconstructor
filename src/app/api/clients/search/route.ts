import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    
    console.log('🔍 API Route: Buscando clientes con término:', term);
    
    if (!term || term.length < 1) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Término de búsqueda requerido'
      });
    }

    const supabase = await getSupabaseServerClient();
    
    // Normalizar término de búsqueda
    const normalizedTerm = term.trim().toLowerCase();
    
    // Búsqueda simple y directa
    const { data: clients, error } = await supabase
      .from('Client')
      .select('id, nombrePrincipal, apellido, email, rut, tipoCliente, estado, razonSocial, telefono, telefonoMovil, calle, ciudad, region')
      .eq('estado', 'activo')
      .or(`nombrePrincipal.ilike.%${normalizedTerm}%,apellido.ilike.%${normalizedTerm}%,email.ilike.%${normalizedTerm}%,rut.ilike.%${normalizedTerm}%,razonSocial.ilike.%${normalizedTerm}%`)
      .order('nombrePrincipal', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Error en consulta Supabase:', error);
      return NextResponse.json({
        success: false,
        error: `Error en base de datos: ${error.message}`,
        data: []
      });
    }

    console.log(`✅ Encontrados ${clients?.length || 0} clientes`);
    
    return NextResponse.json({
      success: true,
      data: clients || [],
      message: `Encontrados ${clients?.length || 0} clientes`
    });

  } catch (error: any) {
    console.error('❌ Error en API search clients:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
      data: []
    }, { status: 500 });
  }
}