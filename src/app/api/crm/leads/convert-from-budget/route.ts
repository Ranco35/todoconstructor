import { NextRequest, NextResponse } from 'next/server';
import { convertBudgetToLead } from '@/actions/crm/leads';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { budget_id, title, description, source, priority, estimated_value, notes } = body;

    if (!budget_id) {
      return NextResponse.json(
        { success: false, error: 'ID del presupuesto es requerido' },
        { status: 400 }
      );
    }

    const result = await convertBudgetToLead({
      budget_id,
      title,
      description,
      source,
      priority,
      estimated_value,
      notes
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in convert-from-budget API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

















