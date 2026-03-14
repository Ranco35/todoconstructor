import { NextResponse } from 'next/server';
import { getBudgetTemplates } from '@/actions/sales/budgets/templates';

export async function GET() {
  try {
    const result = await getBudgetTemplates();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en endpoint de plantillas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}
