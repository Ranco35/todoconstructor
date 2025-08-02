import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { warehouseId, categoryId } = await request.json()

    if (!warehouseId && !categoryId) {
      return NextResponse.json({ 
        error: 'warehouseId o categoryId es requerido' 
      }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    let count = 0
    
    if (warehouseId) {
      // Contar productos asignados a la bodega
      const { count: warehouseCount, error } = await supabase
      .from('Warehouse_Product')
      .select('id', { count: 'exact', head: true })
      .eq('warehouseId', warehouseId)

    if (error) {
        return NextResponse.json({ 
          error: 'Error contando productos de bodega' 
        }, { status: 500 })
      }
      
      count = warehouseCount || 0
    } else if (categoryId) {
      // Contar productos de la categoría
      const { count: categoryCount, error } = await supabase
        .from('Product')
        .select('id', { count: 'exact', head: true })
        .eq('categoryid', categoryId)

      if (error) {
        return NextResponse.json({ 
          error: 'Error contando productos de categoría' 
        }, { status: 500 })
      }
      
      count = categoryCount || 0
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error en count endpoint:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
} 