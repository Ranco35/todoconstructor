import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStats } from '@/actions/sales/payments/list';

export async function GET(request: NextRequest) {
  try {
    // Obtener estadísticas de pagos
    const result = await getPaymentStats();

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en endpoint de estadísticas de pagos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
} 