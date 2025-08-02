import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/actions/products/list';

/**
 * GET /api/products/list
 * API Route fallback para getProducts Server Action
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: Obteniendo productos...');
    
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
    const warehouseId = searchParams.get('warehouseId') ? parseInt(searchParams.get('warehouseId')!) : undefined;
    
    const params = {
      search,
      page,
      pageSize,
      categoryId,
      warehouseId
    };
    
    console.log('🔍 API Route: Obteniendo productos con parámetros:', params);
    
    // Llamar a la Server Action original
    const result = await getProducts(params);
    
    console.log('✅ API Route: Productos obtenidos:', {
      count: result.products?.length || 0,
      total: result.totalCount
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('❌ API Route: Error obteniendo productos:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo productos',
      data: { products: [], totalCount: 0 }
    }, { status: 500 });
  }
}