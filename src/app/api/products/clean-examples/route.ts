import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/actions/configuration/auth-actions'

export async function DELETE() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = await getSupabaseServerClient()
    
    // Patrones para identificar productos de ejemplo
    const examplePatterns = [
      'producto test',
      'producto simulado',
      'servicio simulado',
      'ejemplo',
      'test',
      'sample',
      'demo',
      'simulado'
    ]
    
    console.log('🧹 Iniciando limpieza de productos de ejemplo...')
    
    // Buscar productos que coincidan con patrones de ejemplo
    let productsToDelete: any[] = []
    
    for (const pattern of examplePatterns) {
      const { data: products, error } = await supabase
        .from('Product')
        .select('id, name, sku')
        .or(`name.ilike.%${pattern}%,sku.ilike.%${pattern}%,description.ilike.%${pattern}%`)
        .eq('active', true)
      
      if (error) {
        console.error(`Error buscando productos con patrón "${pattern}":`, error)
        continue
      }
      
      if (products && products.length > 0) {
        productsToDelete.push(...products)
        console.log(`📋 Encontrados ${products.length} productos con patrón "${pattern}":`, products.map(p => p.name))
      }
    }
    
    // Eliminar duplicados por ID
    const uniqueProducts = productsToDelete.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    )
    
    if (uniqueProducts.length === 0) {
      console.log('✅ No se encontraron productos de ejemplo para eliminar')
      return NextResponse.json({
        success: true,
        message: 'No se encontraron productos de ejemplo para eliminar',
        deletedCount: 0
      })
    }
    
    console.log(`🗑️ Eliminando ${uniqueProducts.length} productos de ejemplo...`)
    
    // Eliminar productos de ejemplo
    const productIds = uniqueProducts.map(p => p.id)
    const { error: deleteError } = await supabase
      .from('Product')
      .delete()
      .in('id', productIds)
    
    if (deleteError) {
      console.error('❌ Error eliminando productos de ejemplo:', deleteError)
      return NextResponse.json({ 
        error: 'Error eliminando productos de ejemplo: ' + deleteError.message 
      }, { status: 500 })
    }
    
    console.log(`✅ Eliminados ${uniqueProducts.length} productos de ejemplo exitosamente`)
    
    return NextResponse.json({
      success: true,
      message: `Eliminados ${uniqueProducts.length} productos de ejemplo`,
      deletedCount: uniqueProducts.length,
      deletedProducts: uniqueProducts.map(p => ({ id: p.id, name: p.name, sku: p.sku }))
    })

  } catch (error) {
    console.error('❌ Error en limpieza de productos de ejemplo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 