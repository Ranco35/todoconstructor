import { NextRequest, NextResponse } from 'next/server';
import { findSupplierWithSuggestions } from '@/actions/purchases/pdf-processor';

/**
 * GET /api/suppliers/suggestions
 * API Route fallback para findSupplierWithSuggestions Server Action
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: Buscando proveedor con sugerencias...');
    
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const rut = searchParams.get('rut') || undefined;
    const name = searchParams.get('name') || undefined;
    
    if (!rut && !name) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere al menos RUT o nombre para buscar',
        data: {
          exactMatch: null,
          suggestions: [],
          hasExactMatch: false
        }
      }, { status: 400 });
    }
    
    console.log('🔍 API Route: Buscando proveedor con:', { rut, name });
    
    // Llamar a la Server Action original
    const result = await findSupplierWithSuggestions(rut, name);
    
    console.log('✅ API Route: Resultado encontrado:', {
      hasExactMatch: result.hasExactMatch,
      suggestions: result.suggestions.length
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('❌ API Route: Error buscando proveedor:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error buscando proveedor',
      data: {
        exactMatch: null,
        suggestions: [],
        hasExactMatch: false
      }
    }, { status: 500 });
  }
}