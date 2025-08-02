import { NextRequest, NextResponse } from 'next/server';
import { listPayments, type PaymentFilters } from '@/actions/sales/payments/list';

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
    const filters: PaymentFilters = {};

    if (searchParams.get('invoiceId')) {
      const invoiceId = parseInt(searchParams.get('invoiceId')!);
      if (!isNaN(invoiceId)) {
        filters.invoiceId = invoiceId;
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

    if (searchParams.get('clientId')) {
      const clientId = parseInt(searchParams.get('clientId')!);
      if (!isNaN(clientId)) {
        filters.clientId = clientId;
      }
    }

    // Obtener pagos
    const result = await listPayments({
      page,
      pageSize,
      filters
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en endpoint de listar pagos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
} 