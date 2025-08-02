import { NextResponse } from 'next/server';
import { getBudgetStats } from '../../../../../actions/sales/budgets/list';

export async function GET() {
  try {
    const result = await getBudgetStats();
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error en endpoint de estadísticas de presupuestos:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
} 