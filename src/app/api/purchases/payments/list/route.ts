import { NextRequest, NextResponse } from 'next/server';
import { listPurchasePayments, type PurchasePaymentFilters } from '@/actions/purchases/payments/list';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extraer parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Validar parámetros de paginación
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { success: false, error: 'Parámetros de paginación inválidos.' },
        { status: 400 }
      );
    }

    // Extraer filtros
    const filters: PurchasePaymentFilters = {};

    if (searchParams.get('purchaseInvoiceId')) {
      const purchaseInvoiceId = parseInt(searchParams.get('purchaseInvoiceId')!);
      if (!isNaN(purchaseInvoiceId)) {
        filters.purchaseInvoiceId = purchaseInvoiceId;
      }
    }

    if (searchParams.get('paymentMethod')) {
      filters.paymentMethod = searchParams.get('paymentMethod')!;
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!;
    }

    if (searchParams.get('dateFrom')) {
      filters.dateFrom = searchParams.get('dateFrom')!;
    }

    if (searchParams.get('dateTo')) {
      filters.dateTo = searchParams.get('dateTo')!;
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }

    if (searchParams.get('supplierId')) {
      const supplierId = parseInt(searchParams.get('supplierId')!);
      if (!isNaN(supplierId)) {
        filters.supplierId = supplierId;
      }
    }

    // Obtener pagos
    const result = await listPurchasePayments({
      page,
      pageSize,
      filters
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en endpoint de listar pagos de compras:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
} 
 
 