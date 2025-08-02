import { NextRequest, NextResponse } from 'next/server';
import { debugPOSSync } from '@/actions/pos/pos-actions';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API - Ejecutando depuración de sincronización POS...');
    
    const result = await debugPOSSync();
    
    if (result.success) {
      console.log('✅ API - Depuración completada exitosamente');
      return NextResponse.json({
        success: true,
        message: 'Depuración completada',
        data: result.data
      });
    } else {
      console.error('❌ API - Error en depuración:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ API - Error inesperado:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 