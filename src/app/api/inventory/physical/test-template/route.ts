import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Prueba básica: obtener solo bodegas
    const { data: warehouses, error: warehouseError } = await supabase
      .from('Warehouse')
      .select('id, name')
      .limit(5)

    if (warehouseError) {
      console.error('Error en test-template:', warehouseError)
      return NextResponse.json({
        error: 'Error obteniendo bodegas',
        details: warehouseError.message,
        code: warehouseError.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      warehouses: warehouses || [],
      count: warehouses?.length || 0
    })

  } catch (error) {
    console.error('Error en test-template:', error)
    return NextResponse.json({
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
} 