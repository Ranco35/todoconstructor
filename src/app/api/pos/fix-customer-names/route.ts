import { NextRequest, NextResponse } from 'next/server'
import { fixPOSSalesCustomerNames } from '@/actions/pos/pos-actions'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Endpoint: Corrigiendo nombres de clientes en ventas POS...')
    
    const result = await fixPOSSalesCustomerNames()
    
    if (!result.success) {
      console.error('❌ Error corrigiendo nombres de clientes:', result.error)
      return NextResponse.json(
        { error: result.error || 'Error corrigiendo nombres de clientes' },
        { status: 500 }
      )
    }
    
    console.log('✅ Nombres de clientes corregidos exitosamente')
    return NextResponse.json({
      success: true,
      message: 'Nombres de clientes corregidos exitosamente',
      data: result.data
    })
  } catch (error) {
    console.error('❌ Error en endpoint fix-customer-names:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 