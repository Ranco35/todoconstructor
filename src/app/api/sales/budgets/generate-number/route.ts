import { NextRequest, NextResponse } from 'next/server';
import { generateBudgetNumber } from '@/actions/sales/budgets/generate-number';

export async function GET(request: NextRequest) {
  try {
    const result = await generateBudgetNumber();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { number: result.data }
    });
  } catch (error) {
    console.error('Error en API generateBudgetNumber:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 