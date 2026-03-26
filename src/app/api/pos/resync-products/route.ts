import { NextRequest, NextResponse } from 'next/server'
import { syncPOSProducts } from '@/actions/pos/pos-actions'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user) return unauthorizedResponse()

  try {
    const result = await syncPOSProducts()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Productos POS resincronizados correctamente',
      data: result.data
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
