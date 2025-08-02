import { NextResponse } from 'next/server'
import { debugPOSSync } from '@/actions/pos/pos-actions'

export async function POST() {
  try {
    const result = await debugPOSSync()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en API debug-pos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 