import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    
    // Obtener todos los productos con sus relaciones
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        type,
        description,
        brand,
        categoryid,
        supplierid
      `)
      .order('name');

    if (productsError) {
      console.error('Error obteniendo productos:', productsError);
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
    }

    // Obtener todas las asignaciones de bodegas
    const { data: warehouseAssignments, error: warehouseError } = await supabase
      .from('Warehouse_Product')
      .select(`
        productId,
        warehouseId,
        quantity,
        minStock,
        maxStock
      `);

    if (warehouseError) {
      console.error('Error obteniendo asignaciones de bodegas:', warehouseError);
      return NextResponse.json({ error: 'Error al obtener asignaciones de bodegas' }, { status: 500 });
    }

    // Agrupar bodegas por producto
    const warehouseMap = new Map();
    warehouseAssignments?.forEach(assignment => {
      if (!warehouseMap.has(assignment.productId)) {
        warehouseMap.set(assignment.productId, []);
      }
      warehouseMap.get(assignment.productId).push({
        warehouseId: assignment.warehouseId,
        quantity: assignment.quantity,
        minStock: assignment.minStock,
        maxStock: assignment.maxStock
      });
    });

    // Combinar productos con sus bodegas
    const productsWithWarehouses = products?.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      type: product.type,
      description: product.description,
      brand: product.brand,
      categoryId: product.categoryid,
      categoryName: product.Category?.name,
      supplierId: product.supplierid,
      warehouses: warehouseMap.get(product.id) || []
    }));

    return NextResponse.json(productsWithWarehouses || []);

  } catch (error) {
    console.error('Error en API /api/products:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 