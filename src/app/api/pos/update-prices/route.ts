import { NextRequest, NextResponse } from 'next/server';
import { updatePOSProductPrices } from '@/actions/pos/pos-actions';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const result = await updatePOSProductPrices();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Precios de productos POS actualizados correctamente',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
