import { NextRequest, NextResponse } from 'next/server';
import { getInvoicesForPayment } from '@/actions/sales/payments/list';

export async function GET(request: NextRequest) {
  try {
    // Obtener facturas disponibles para pago
    const result = await getInvoicesForPayment();

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en endpoint de facturas para pago:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
} 