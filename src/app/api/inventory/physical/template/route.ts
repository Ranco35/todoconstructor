import { NextRequest, NextResponse } from 'next/server'
import { exportInventoryPhysicalTemplate } from '@/actions/inventory/inventory-physical'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [API] Iniciando generación de plantilla de inventario físico')
    
    const { warehouseId, categoryId, includeAllProducts } = await request.json()
    console.log('🔍 [API] Parámetros recibidos:', { warehouseId, categoryId, includeAllProducts })

    // Se permite:
    //  - Modo bodega: warehouseId requerido
    //  - Modo categoría ("Todos los productos de una categoría"): categoryId requerido,
    //    bodega opcional (si no se indica, stock se exporta en 0)
    if (!warehouseId && !(includeAllProducts && categoryId)) {
      console.error('❌ [API] Se requiere bodega o categoría')
      return NextResponse.json(
        { error: 'Debes seleccionar una bodega, o una categoría con la opción "Todos los productos".' },
        { status: 400 }
      )
    }

    // Obtener nombre de categoría si aplica
    let categoryName = ''
    if (includeAllProducts && categoryId) {
      try {
        const supabase = await getSupabaseServiceClient()
        const { data: category } = await supabase
          .from('Category')
          .select('name')
          .eq('id', categoryId)
          .single()
        
        if (category?.name) {
          categoryName = category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        }
      } catch (error) {
        console.warn('⚠️ [API] No se pudo obtener nombre de categoría:', error)
      }
    }
    
    // Usar la nueva función con colores
    console.log('🔍 [API] Llamando a exportInventoryPhysicalTemplate...')
    const buffer = await exportInventoryPhysicalTemplate(warehouseId ?? null, categoryId, includeAllProducts)

    // Generar nombre de archivo descriptivo
    let filename = 'inventario-fisico'
    if (warehouseId) {
      filename += `-bodega-${warehouseId}`
    }
    if (includeAllProducts && categoryId) {
      if (categoryName) {
        filename += `-categoria-${categoryName}`
      } else {
        filename += `-categoria-${categoryId}`
      }
    }
    filename += `.xlsx`
    
    console.log('✅ [API] Plantilla generada exitosamente, tamaño:', buffer.byteLength, 'bytes')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('💥 [API] Error generando plantilla:', error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
} 