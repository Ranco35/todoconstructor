import { NextRequest, NextResponse } from 'next/server';
import { createPurchasePayment } from '@/actions/purchases/payments/create';

/**
 * POST /api/purchases/payments/create
 * Crear un nuevo pago de factura de compra
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API: Creando pago de factura de compra...');
    
    const body = await request.json();
    
    const result = await createPurchasePayment(body);
    
    if (result.success) {
      console.log('✅ API: Pago creado exitosamente');
      return NextResponse.json(result);
    } else {
      console.error('❌ API: Error al crear pago:', result.error);
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('❌ API: Error inesperado al crear pago:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 
 