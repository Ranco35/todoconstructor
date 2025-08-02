import { NextRequest, NextResponse } from 'next/server'
import { importInventoryPhysicalExcel } from '@/actions/inventory/inventory-physical'
import { getCurrentUser } from '@/actions/configuration/auth-actions'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const warehouseId = Number(formData.get('warehouseId'))
    const comentarios = formData.get('comentarios') as string

    if (!file || !warehouseId) {
      return NextResponse.json({ 
        error: 'Archivo y bodega son requeridos' 
      }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const result = await importInventoryPhysicalExcel({
      fileBuffer: buffer,
      warehouseId,
      userId: user.id,
      comentarios
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error importando inventario físico:', error)
    return NextResponse.json({ 
      error: 'Error procesando archivo' 
    }, { status: 500 })
  }
} 