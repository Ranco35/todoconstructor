import { NextRequest, NextResponse } from 'next/server';
import { getPurchasePaymentStats } from '@/actions/purchases/payments/list';

export async function GET(request: NextRequest) {
  try {
    const result = await getPurchasePaymentStats();

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en endpoint de estadísticas de pagos de compras:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
} 
 
 