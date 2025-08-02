import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Debug API: Verificando producto ID:', params.id);
    
    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({
        exists: false,
        error: 'ID inválido',
        product: null
      });
    }

    const supabase = await getSupabaseClient();
    
    // Consulta directa sin políticas RLS para debug
    const { data: product, error } = await supabase
      .from('Product')
      .select('id, name, sku, active, created_at')
      .eq('id', productId)
      .single();

    console.log('📊 Debug API: Resultado query:', { product, error });

    if (error) {
      console.log('❌ Debug API: Error en query:', error);
      return NextResponse.json({
        exists: false,
        error: error.message,
        product: null,
        queryError: error
      });
    }

    if (!product) {
      console.log('🔍 Debug API: Producto no encontrado');
      return NextResponse.json({
        exists: false,
        error: 'Producto no encontrado',
        product: null
      });
    }

    console.log('✅ Debug API: Producto encontrado:', product);
    return NextResponse.json({
      exists: true,
      error: null,
      product: product
    });

  } catch (error) {
    console.error('💥 Debug API: Error interno:', error);
    return NextResponse.json({
      exists: false,
      error: 'Error interno del servidor',
      product: null,
      internalError: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
} 