import { NextRequest, NextResponse } from 'next/server'
import { cleanPOSProductPrices } from '@/actions/pos/pos-actions'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user) return unauthorizedResponse()

  try {
    const result = await cleanPOSProductPrices()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.data?.message || 'Limpieza completada',
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
