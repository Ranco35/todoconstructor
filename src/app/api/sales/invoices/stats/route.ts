import { NextResponse } from 'next/server';
import { getInvoiceStats } from '../../../../../actions/sales/invoices/list';

export async function GET() {
  try {
    const result = await getInvoiceStats();
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error en endpoint de estadísticas de facturas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
} 