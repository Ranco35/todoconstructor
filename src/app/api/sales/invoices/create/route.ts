import { NextRequest, NextResponse } from 'next/server';
import { createInvoice, CreateInvoiceInput } from '../../../../../actions/sales/invoices/create';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validación básica de tipo
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Datos inválidos.' }, { status: 400 });
    }

    const input: CreateInvoiceInput = body;

    const result = await createInvoice(input);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error en endpoint de creación de facturas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
} 