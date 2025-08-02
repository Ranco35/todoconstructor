import { NextRequest, NextResponse } from 'next/server'
import { getPOSSaleById } from '@/actions/pos/pos-actions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = parseInt(params.id)
    
    if (isNaN(saleId)) {
      return NextResponse.json(
        { error: 'ID de venta inválido' },
        { status: 400 }
      )
    }
    
    const result = await getPOSSaleById(saleId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Venta no encontrada' ? 404 : 500 }
      )
    }
    
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in POS sale detail API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 