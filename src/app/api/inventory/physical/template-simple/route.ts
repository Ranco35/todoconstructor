import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const XLSX = await import('xlsx')
    const { warehouseId } = await request.json()

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'warehouseId es requerido' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Obtener información básica de la bodega
    const { data: warehouseData, error: warehouseError } = await supabase
      .from('Warehouse')
      .select('name')
      .eq('id', warehouseId)
      .single()

    if (warehouseError) {
      console.error('Error obteniendo bodega:', warehouseError)
      return NextResponse.json(
        { error: `Error obteniendo bodega: ${warehouseError.message}` },
        { status: 500 }
      )
    }

    // Obtener productos básicos asignados a la bodega
    const { data: warehouseProducts, error: wpError } = await supabase
      .from('Warehouse_Product')
      .select(`
        quantity,
        Product:Product(id, name, sku, brand, description, image)
      `)
      .eq('warehouseId', warehouseId)

    if (wpError) {
      console.error('Error obteniendo productos:', wpError)
      return NextResponse.json(
        { error: `Error obteniendo productos: ${wpError.message}` },
        { status: 500 }
      )
    }

    if (!warehouseProducts || warehouseProducts.length === 0) {
      return NextResponse.json(
        { error: 'No hay productos asignados a esta bodega' },
        { status: 400 }
      )
    }

    // Preparar datos básicos para Excel
    const rows = warehouseProducts.map((wp: any) => ({
      SKU: wp.Product?.sku || '',
      Bodega: warehouseData?.name || '',
      'Nombre Producto': wp.Product?.name || '',
      Marca: wp.Product?.brand || '',
      Descripción: wp.Product?.description || '',
      'Código Proveedor': '',
      Imagen: wp.Product?.image ? 'Con imagen' : 'Sin imagen',
      'Cantidad Actual': wp.quantity || 0,
      'Cantidad Real (Conteo Físico)': ''
    }))

    // Crear Excel simple
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 15 }, // SKU
      { wch: 12 }, // Bodega
      { wch: 25 }, // Nombre Producto
      { wch: 12 }, // Marca
      { wch: 20 }, // Descripción
      { wch: 15 }, // Código Proveedor
      { wch: 12 }, // Imagen
      { wch: 12 }, // Cantidad Actual
      { wch: 20 }  // Cantidad Real
    ]
    worksheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Fisico')

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = `inventario-fisico-${warehouseData?.name?.toLowerCase().replace(/\s+/g, '-') || 'bodega'}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error en endpoint simple:', error)
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
} 