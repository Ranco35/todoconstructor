import { NextRequest, NextResponse } from 'next/server';
import { convertBudgetToInvoice } from '../../../../../actions/sales/invoices/create';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validación básica
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Datos inválidos.' }, { status: 400 });
    }

    const { budgetId } = body;

    if (!budgetId || typeof budgetId !== 'number') {
      return NextResponse.json({ success: false, error: 'ID de presupuesto inválido.' }, { status: 400 });
    }

    const result = await convertBudgetToInvoice(budgetId);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error en endpoint de conversión presupuesto a factura:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
} 