import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // Obtener estadísticas básicas
    const [
      { count: totalTomas },
      { data: historyData },
      { data: bodegasActivas }
    ] = await Promise.all([
      supabase.from('InventoryPhysicalHistory').select('*', { count: 'exact', head: true }),
      supabase.from('InventoryPhysicalHistory').select('totalActualizados, totalErrores'),
      supabase.from('InventoryPhysicalHistory')
        .select('warehouseId, Warehouse:warehouseId(name)')
        .order('fecha', { ascending: false })
    ])

    // Calcular totales
    const totalProductosActualizados = (historyData || []).reduce((sum: number, item: any) => sum + (item.totalActualizados || 0), 0)
    const totalErrores = (historyData || []).reduce((sum: number, item: any) => sum + (item.totalErrores || 0), 0)
    
    // Calcular promedio de diferencias
    const promedioDiferencias = totalTomas > 0 ? Math.round(totalProductosActualizados / totalTomas) : 0

    // Contar bodegas más activas
    const bodegasCount: { [key: string]: number } = {}
    ;(bodegasActivas || []).forEach((item: any) => {
      const bodegaName = item.Warehouse?.name || 'Sin nombre'
      bodegasCount[bodegaName] = (bodegasCount[bodegaName] || 0) + 1
    })

    const bodegasMasActivas = Object.entries(bodegasCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      totalTomas: totalTomas || 0,
      totalProductosActualizados,
      totalErrores,
      promedioDiferencias,
      bodegasMasActivas
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 