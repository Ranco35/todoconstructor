import { NextRequest, NextResponse } from 'next/server';
import { fixPOSSalesCustomerNamesNull } from '@/actions/pos/pos-actions';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const result = await fixPOSSalesCustomerNamesNull();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
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
