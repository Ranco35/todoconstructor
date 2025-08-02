import { NextRequest, NextResponse } from 'next/server';
import { getPurchaseInvoicesForPayment } from '@/actions/purchases/payments/list';

/**
 * GET /api/purchases/payments/invoices
 * Obtener facturas de compras disponibles para pago
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentStatusFilter = searchParams.get('paymentStatus') || undefined;
    
    console.log('🔍 API: Obteniendo facturas disponibles para pago con filtro:', paymentStatusFilter);
    
    const result = await getPurchaseInvoicesForPayment(paymentStatusFilter);
    
    if (result.success) {
      console.log('✅ API: Facturas obtenidas exitosamente:', result.data?.length || 0);
      return NextResponse.json({
        success: true,
        data: result.data || [],
        count: result.data?.length || 0
      });
    } else {
      console.error('❌ API: Error al obtener facturas:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Error interno del servidor'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ API: Error inesperado al obtener facturas:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 
 