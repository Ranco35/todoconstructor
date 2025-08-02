import { NextResponse } from 'next/server'
import { syncPOSProducts } from '@/actions/pos/pos-actions'

export async function POST() {
  try {
    const result = await syncPOSProducts()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en API sync-pos-products:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 