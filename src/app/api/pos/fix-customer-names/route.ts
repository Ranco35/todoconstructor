import { NextRequest, NextResponse } from 'next/server'
import { fixPOSSalesCustomerNames } from '@/actions/pos/pos-actions'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user) return unauthorizedResponse()

  try {
    const result = await fixPOSSalesCustomerNames()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error corrigiendo nombres de clientes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Nombres de clientes corregidos exitosamente',
      data: result.data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
