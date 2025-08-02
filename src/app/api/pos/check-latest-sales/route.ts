import { NextRequest, NextResponse } from 'next/server'
import { checkLatestPOSSales } from '@/actions/pos/pos-actions'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Endpoint: Revisando últimas ventas POS y cliente recién creado...')
    
    const result = await checkLatestPOSSales()
    
    if (!result.success) {
      console.error('❌ Error revisando últimas ventas:', result.error)
      return NextResponse.json(
        { error: result.error || 'Error revisando últimas ventas' },
        { status: 500 }
      )
    }
    
    console.log('✅ Revisión de últimas ventas completada')
    return NextResponse.json({
      success: true,
      message: 'Revisión de últimas ventas completada',
      data: result.data
    })
  } catch (error) {
    console.error('❌ Error en endpoint check-latest-sales:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 