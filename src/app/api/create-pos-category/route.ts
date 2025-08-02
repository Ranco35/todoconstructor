import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API - Creando categoría POS por defecto...');
    const supabase = await getSupabaseClient();
    
    // Verificar si la tabla POSProductCategory existe
    const { data: tableExists, error: tableError } = await supabase
      .from('POSProductCategory')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error verificando tabla POSProductCategory:', tableError);
      return NextResponse.json({
        success: false,
        error: `La tabla POSProductCategory no existe o no es accesible: ${tableError.message}`
      }, { status: 500 });
    }
    
    console.log('✅ Tabla POSProductCategory existe');
    
    // Insertar categoría por defecto
    const { data: category, error: insertError } = await supabase
      .from('POSProductCategory')
      .insert({
        name: 'default',
        displayName: 'General',
        icon: 'package',
        color: '#3B82F6',
        isActive: true,
        sortOrder: 1
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error insertando categoría POS:', insertError);
      return NextResponse.json({
        success: false,
        error: `Error insertando categoría: ${insertError.message}`
      }, { status: 500 });
    }
    
    console.log('✅ Categoría POS creada exitosamente:', category);
    
    return NextResponse.json({
      success: true,
      message: 'Categoría POS creada exitosamente',
      data: category
    });
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 