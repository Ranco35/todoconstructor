import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await getSupabaseServerClient()
    
    let query = supabase
      .from('InventoryPhysicalHistory')
      .select(`
        id,
        warehouseId,
        userId,
        fecha,
        comentarios,
        diferencias,
        totalActualizados,
        totalErrores,
        Warehouse:warehouseId(name),
        User:userId(name)
      `, { count: 'exact' })
      .order('fecha', { ascending: false })
      .range(offset, offset + limit - 1)

    if (warehouseId) {
      query = query.eq('warehouseId', warehouseId)
    }
    if (startDate) {
      query = query.gte('fecha', startDate)
    }
    if (endDate) {
      query = query.lte('fecha', endDate)
    }
    if (userId) {
      query = query.ilike('userId', `%${userId}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Error obteniendo historial' },
        { status: 500 }
      )
    }

    const formattedData = (data || []).map((item: any) => ({
      id: item.id,
      warehouseId: item.warehouseId,
      warehouseName: item.Warehouse?.name || 'Bodega no encontrada',
      userId: item.userId,
      userName: item.User?.name || 'Usuario no encontrado',
      fecha: item.fecha,
      comentarios: item.comentarios,
      diferencias: item.diferencias || [],
      totalActualizados: item.totalActualizados,
      totalErrores: item.totalErrores
    }))

    return NextResponse.json({
      data: formattedData,
      total: count || 0
    })
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 