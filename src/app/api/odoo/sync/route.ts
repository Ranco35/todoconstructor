import { NextRequest, NextResponse } from 'next/server';
import { syncProductsFromOdoo, testOdooConnection } from '@/actions/configuration/odoo-sync';

export async function GET(request: NextRequest) {
  try {
    // Verificar conexión antes de sincronizar
    const connectionTest = await testOdooConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo conectar con Odoo',
        details: connectionTest.message
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con Odoo',
      productCount: connectionTest.productCount
    });

  } catch (error) {
    console.error('Error en API de Odoo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { includeImages = true, force = false } = body || {};

    console.log('🚀 Iniciando sincronización desde API endpoint');

    // Ejecutar sincronización
    const result = await syncProductsFromOdoo(includeImages);

    // Retornar resultado
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        stats: result.stats,
        warnings: result.warnings
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        errors: result.errors,
        stats: result.stats
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error durante sincronización API:', error);
    return NextResponse.json({
      success: false,
      error: 'Error durante la sincronización',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 