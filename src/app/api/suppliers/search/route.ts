import { NextRequest, NextResponse } from 'next/server';
import { searchSuppliers } from '@/actions/purchases/common';

/**
 * GET /api/suppliers/search
 * API Route fallback para searchSuppliers Server Action
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: Buscando proveedores...');
    
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
    
    console.log('🔍 API Route: Buscando proveedores con término:', term);
    
    // Llamar a la Server Action original
    const suppliers = await searchSuppliers(term);
    
    console.log('✅ API Route: Proveedores encontrados:', suppliers.length);
    
    return NextResponse.json({
      success: true,
      data: suppliers
    });
    
  } catch (error: any) {
    console.error('❌ API Route: Error buscando proveedores:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error buscando proveedores',
      data: []
    }, { status: 500 });
  }
}