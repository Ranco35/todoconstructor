import { NextRequest, NextResponse } from 'next/server';
import { listBudgets, ListBudgetsInput } from '../../../../../actions/sales/budgets/list';
import type { BudgetFilters } from '../../../../../types/ventas/budget';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    
    // Filtros
    const filters: BudgetFilters = {};
    
    const status = searchParams.get('status');
    if (status) {
      filters.status = status as any; // Validar en el backend
    }
    
    const clientId = searchParams.get('clientId');
    if (clientId) {
      filters.clientId = parseInt(clientId, 10);
    }
    
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = dateTo;
    }
    
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Validación básica
    if (page < 1) {
      return NextResponse.json({ success: false, error: 'La página debe ser mayor a 0.' }, { status: 400 });
    }
    
    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json({ success: false, error: 'El tamaño de página debe estar entre 1 y 100.' }, { status: 400 });
    }

    const input: ListBudgetsInput = {
      page,
      pageSize,
      filters
    };

    const result = await listBudgets(input);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error en endpoint de listado de presupuestos:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
} 