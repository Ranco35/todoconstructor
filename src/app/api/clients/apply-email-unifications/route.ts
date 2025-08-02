import { NextRequest, NextResponse } from 'next/server';
import { applyEmailUnifications } from '@/actions/clients/import';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 API: Recibiendo request de unificación de emails duplicados');
    
    const { unifications } = await request.json();
    
    if (!unifications || !Array.isArray(unifications)) {
      console.error('❌ API: unifications es requerido y debe ser un array');
      return NextResponse.json(
        { error: 'unifications es requerido y debe ser un array' },
        { status: 400 }
      );
    }

    console.log(`📊 API: Procesando ${unifications.length} unificaciones`);

    // Aplicar las unificaciones
    console.log('🔄 API: Aplicando unificaciones...');
    const result = await applyEmailUnifications(unifications);
    console.log('✅ API: Unificaciones completadas:', result);
    
    const response = {
      success: true,
      message: `Unificaciones aplicadas. Creados: ${result.created}, Saltados: ${result.skipped}`,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors
    };
    
    console.log('📤 API: Enviando respuesta:', {
      success: response.success,
      created: response.created,
      skipped: response.skipped,
      errorsCount: response.errors.length
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API: Error en unificación de emails:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al aplicar unificaciones',
        created: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      },
      { status: 500 }
    );
  }
} 