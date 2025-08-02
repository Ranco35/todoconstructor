import { NextRequest, NextResponse } from 'next/server'
import { syncPOSProducts } from '@/actions/pos/pos-actions'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando resincronización de productos POS...')
    
    const result = await syncPOSProducts()
    
    if (!result.success) {
      console.error('❌ Error en resincronización:', result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
    
    console.log('✅ Resincronización completada:', result.data)
    return NextResponse.json({
      success: true,
      message: 'Productos POS resincronizados correctamente',
      data: result.data
    })
    
  } catch (error) {
    console.error('❌ Error inesperado en resincronización:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 