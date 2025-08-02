import { NextRequest, NextResponse } from 'next/server';
import { fixPOSSalesCustomerNamesNull } from '@/actions/pos/pos-actions';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Endpoint: Corrigiendo ventas con customerName = NULL...');
    
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
    console.error('❌ Error en endpoint fix-customer-names-null:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 