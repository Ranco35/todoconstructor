import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('🔍 API de prueba de diagnóstico ejecutado');

  try {
    // Prueba 1: Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('📊 Variables de entorno:');
    console.log('  SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'No configurada');
    console.log('  SUPABASE_KEY:', supabaseKey ? 'Configurada' : 'No configurada');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Variables de entorno de Supabase no configuradas',
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      }, { status: 500 });
    }

    // Prueba 2: Crear cliente Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    console.log('✅ Cliente Supabase creado exitosamente');

    // Prueba 3: Probar conexión a base de datos
    const { data, error } = await supabase
      .from('EmailAnalysis')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión a Supabase:', error);
      return NextResponse.json({
        success: false,
        error: 'Error de conexión a Supabase',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Conexión a Supabase exitosa');

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico completado exitosamente',
      details: {
        environment: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        },
        database: 'Conectado exitosamente',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno en diagnóstico',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 