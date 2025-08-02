import { NextRequest, NextResponse } from 'next/server';
import { createBudget, CreateBudgetInput } from '../../../../../actions/sales/budgets/create';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validación básica de tipo
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Datos inválidos.' }, { status: 400 });
    }
    const input: CreateBudgetInput = body;
    const result = await createBudget(input);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error inesperado.' }, { status: 500 });
  }
} 