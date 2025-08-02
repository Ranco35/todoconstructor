import { NextResponse } from 'next/server'
import { cleanPOSProductPrices } from '@/actions/pos/pos-actions'

export async function POST() {
  try {
    console.log('🔄 API: Iniciando limpieza de precios POS...')
    
    const result = await cleanPOSProductPrices()
    
    if (result.success) {
      console.log('✅ API: Limpieza completada exitosamente')
      return NextResponse.json({
        success: true,
        message: result.data?.message || 'Limpieza completada',
        data: result.data
      })
    } else {
      console.error('❌ API: Error en limpieza:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ API: Error interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint para limpiar precios con decimales en productos POS',
    instructions: 'Usa POST para ejecutar la limpieza',
    description: 'Este endpoint redondea todos los precios que tengan decimales en la tabla POSProduct'
  })
} 