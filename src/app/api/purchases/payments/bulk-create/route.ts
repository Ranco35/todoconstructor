import { NextRequest, NextResponse } from 'next/server';
import { createBulkPurchasePayment } from '@/actions/purchases/payments/bulk-create';

/**
 * POST /api/purchases/payments/bulk-create
 * Crear pagos múltiples para varias facturas con una sola transferencia
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API: Creando pago múltiple de facturas...');
    
    const body = await request.json();
    
    // Validaciones básicas
    if (!body.invoice_ids || !Array.isArray(body.invoice_ids) || body.invoice_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Debe proporcionar al menos una factura para pagar'
      }, { status: 400 });
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'El monto debe ser mayor a 0'
      }, { status: 400 });
    }

    if (!body.payment_method) {
      return NextResponse.json({
        success: false,
        error: 'Debe especificar un método de pago'
      }, { status: 400 });
    }

    if (!body.reference || body.reference.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'La referencia del pago es obligatoria para pagos múltiples'
      }, { status: 400 });
    }

    const result = await createBulkPurchasePayment(body);
    
    if (result.success) {
      console.log('✅ API: Pago múltiple creado exitosamente');
      return NextResponse.json(result);
    } else {
      console.error('❌ API: Error al crear pago múltiple:', result.error);
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('❌ API: Error inesperado al crear pago múltiple:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}