import { NextRequest, NextResponse } from 'next/server';
import { updatePOSProductPrices } from '@/actions/pos/pos-actions';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API - Actualizando precios de productos POS con precios congelados...');
    
    const result = await updatePOSProductPrices();
    
    if (result.success) {
      console.log('✅ API - Actualización de precios POS completada exitosamente');
      return NextResponse.json({
        success: true,
        message: 'Precios de productos POS actualizados correctamente',
        data: result.data
      });
    } else {
      console.error('❌ API - Error en actualización de precios POS:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ API - Error inesperado en actualización de precios POS:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 