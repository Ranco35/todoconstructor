import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/actions/purchases/common';

/**
 * GET /api/products/search
 * API Route fallback para searchProducts Server Action
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: Buscando productos...');
    
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    
    if (!term) {
      return NextResponse.json({
        success: false,
        error: 'Término de búsqueda requerido',
        data: []
      }, { status: 400 });
    }
    
    console.log('🔍 API Route: Buscando productos con término:', term);
    
    // Llamar a la Server Action original
    const products = await searchProducts(term);
    
    console.log('✅ API Route: Productos encontrados:', products.length);
    
    return NextResponse.json({
      success: true,
      data: products
    });
    
  } catch (error: any) {
    console.error('❌ API Route: Error buscando productos:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error buscando productos',
      data: []
    }, { status: 500 });
  }
}