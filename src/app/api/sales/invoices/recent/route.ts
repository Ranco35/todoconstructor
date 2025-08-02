import { NextRequest, NextResponse } from 'next/server';
import { getRecentInvoices } from '../../../../../actions/sales/invoices/list';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parsear parámetros
    const limit = Number(searchParams.get('limit')) || 10;
    
    const result = await getRecentInvoices(limit);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error en endpoint de facturas recientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
} 