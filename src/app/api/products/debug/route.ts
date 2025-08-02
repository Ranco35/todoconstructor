import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/actions/configuration/auth-actions'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = await getSupabaseServerClient()
    
    // Obtener todos los productos con información completa
    const { data: products, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        description,
        saleprice,
        category_id,
        active,
        created_at
      `)
      .order('name')

    if (error) {
      console.error('Error obteniendo productos:', error)
      return NextResponse.json({ error: 'Error obteniendo productos' }, { status: 500 })
    }

    console.log(`✅ Productos obtenidos: ${products?.length || 0} productos`)

    return NextResponse.json({
      success: true,
      products: products || [],
      total: products?.length || 0
    })

  } catch (error) {
    console.error('Error en debug products:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 