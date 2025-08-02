import { NextRequest, NextResponse } from 'next/server';
import { listInvoices, type InvoiceFilters } from '../../../../../actions/sales/invoices/list';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parsear parámetros de paginación
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    
    // Parsear filtros
    const filters: InvoiceFilters = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!;
    }
    
    if (searchParams.get('clientId')) {
      filters.clientId = Number(searchParams.get('clientId'));
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

    const result = await listInvoices({
      page,
      pageSize,
      filters
    });
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error en endpoint de listado de facturas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
} 