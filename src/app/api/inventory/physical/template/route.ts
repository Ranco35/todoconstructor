import { NextRequest, NextResponse } from 'next/server'
import { exportInventoryPhysicalTemplate } from '@/actions/inventory/inventory-physical'

export async function POST(request: NextRequest) {
  try {
    const { warehouseId, categoryId, includeAllProducts } = await request.json()

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'warehouseId es requerido' },
        { status: 400 }
      )
    }

    // Usar la nueva función con colores
    const buffer = await exportInventoryPhysicalTemplate(warehouseId, categoryId, includeAllProducts)
    
    const filename = `inventario-fisico-con-colores.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error generando plantilla:', error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
} 