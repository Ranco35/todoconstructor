import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    console.log('🔍 API Route: Obteniendo productos modulares, category:', category);
    
    const supabase = await getSupabaseServerClient();
    
    // Consulta simple sin joins complejos
    const { data: modularProducts, error } = await supabase
      .from('products_modular')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error en consulta productos modulares:', error);
      return NextResponse.json({
        data: [],
        error: `Error en base de datos: ${error.message}`
      });
    }

    if (!modularProducts || !Array.isArray(modularProducts)) {
      console.log('⚠️ No hay productos modulares');
      return NextResponse.json({
        data: [],
        error: null
      });
    }

    console.log(`✅ Productos encontrados: ${modularProducts.length}`);

    // Filtrar por categoría si se especifica
    let filteredProducts = modularProducts;
    if (category && category !== 'undefined') {
      filteredProducts = modularProducts.filter(p => p && p.category === category);
      console.log(`🔍 Filtrados por categoría '${category}': ${filteredProducts.length}`);
    }

    // Mapear a formato correcto
    const products = filteredProducts.map(product => ({
      id: Number(product.id) || 0,
      code: String(product.code || ''),
      name: String(product.name || 'Producto sin nombre'),
      description: String(product.description || ''),
      price: Number(product.price) || 0,
      category: String(product.category || ''),
      per_person: Boolean(product.per_person),
      is_active: Boolean(product.is_active),
      sort_order: Number(product.sort_order) || 0,
      original_id: product.original_id ? Number(product.original_id) : undefined,
      sku: String(product.sku || '')
    }));

    console.log('✅ Productos procesados:', products.length);
    
    return NextResponse.json({
      data: products,
      error: null
    });

  } catch (error: any) {
    console.error('❌ Error en API productos modulares:', error);
    return NextResponse.json({
      data: [],
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}