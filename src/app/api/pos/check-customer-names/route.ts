import { NextRequest, NextResponse } from 'next/server'
import { checkPOSSalesCustomerNames } from '@/actions/pos/pos-actions'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Endpoint: Revisando nombres de clientes en ventas POS...')
    
    const result = await checkPOSSalesCustomerNames()
    
    if (!result.success) {
      console.error('❌ Error revisando nombres de clientes:', result.error)
      return NextResponse.json(
        { error: result.error || 'Error revisando nombres de clientes' },
        { status: 500 }
      )
    }
    
    console.log('✅ Revisión de nombres de clientes completada')
    return NextResponse.json({
      success: true,
      message: 'Revisión de nombres de clientes completada',
      data: result.data
    })
  } catch (error) {
    console.error('❌ Error en endpoint check-customer-names:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 