import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const url = new URL(request.url)

    const productId = url.searchParams.get('productId')
    const fromWarehouseId = url.searchParams.get('fromWarehouseId')
    const toWarehouseId = url.searchParams.get('toWarehouseId')
    const movementType = url.searchParams.get('movementType')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const userId = url.searchParams.get('userId')

    let query = supabase
      .from('InventoryMovement')
      .select(`
        *,
        Product:Product(name, sku),
        FromWarehouse:Warehouse!InventoryMovement_fromWarehouseId_fkey(name),
        ToWarehouse:Warehouse!InventoryMovement_toWarehouseId_fkey(name),
        User:User(name, email)
      `)
      .order('createdAt', { ascending: false })

    if (productId) query = query.eq('productId', Number(productId))
    if (fromWarehouseId) query = query.eq('fromWarehouseId', Number(fromWarehouseId))
    if (toWarehouseId) query = query.eq('toWarehouseId', Number(toWarehouseId))
    if (movementType) query = query.eq('movementType', movementType)
    if (startDate) query = query.gte('createdAt', startDate)
    if (endDate) query = query.lte('createdAt', endDate)
    if (userId) query = query.eq('userId', userId)

    const { data, error } = await query
    if (error) {
      console.error('Error fetching movements for export:', error)
      return NextResponse.json({ error: 'Error obteniendo movimientos' }, { status: 500 })
    }

    const XLSX = await import('xlsx')
    const rows = (data || []).map((m: any) => ({
      Fecha: m.createdAt ? new Date(m.createdAt).toLocaleString('es-CL') : '',
      Tipo: m.movementType,
      Producto: m.Product?.name || '',
      SKU: m.Product?.sku || '',
      'Bodega Origen': m.FromWarehouse?.name || '',
      'Bodega Destino': m.ToWarehouse?.name || '',
      Cantidad: m.quantity || 0,
      Razón: m.reason || '',
      Usuario: m.User?.email || ''
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const filename = 'movimientos-inventario.xlsx'
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err) {
    console.error('Export movements error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


