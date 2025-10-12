import { NextRequest, NextResponse } from 'next/server';
import { updateCategoryPricesFromCost } from '@/actions/pricing/price-management-actions';

export async function POST(request: NextRequest) {
  try {
    const { categoryId, reason = 'margin_adjustment' } = await request.json();

    if (!categoryId || typeof categoryId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }

    const result = await updateCategoryPricesFromCost(categoryId, reason);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en API update-category-prices:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




