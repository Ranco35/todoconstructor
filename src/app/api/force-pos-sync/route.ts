import { NextRequest, NextResponse } from 'next/server';
import { syncPOSProducts } from '@/actions/pos/pos-actions';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API - Forzando sincronización manual de productos POS...');
    
    const result = await syncPOSProducts();
    
    if (result.success) {
      console.log('✅ API - Sincronización forzada completada exitosamente');
      return NextResponse.json({
        success: true,
        message: 'Sincronización forzada completada',
        data: result.data
      });
    } else {
      console.error('❌ API - Error en sincronización forzada:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ API - Error inesperado en sincronización forzada:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 