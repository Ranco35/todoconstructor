import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCategoryTableName } from '@/lib/table-resolver';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    
    if (!productId || isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    // Obtener información del producto
    const { data: product, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        saleprice,
        image,
        description,
        categoryid
      `)
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error getting product:', error);
      return NextResponse.json(
        { error: 'Error obteniendo producto' },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Obtener categoría si existe
    let categoryName = 'Sin categoría';
    if (product.categoryid) {
      const categoryTable = await getCategoryTableName(supabase as any);
      const { data: category } = await (supabase as any)
        .from(categoryTable)
        .select('name')
        .eq('id', product.categoryid)
        .single();
      
      if (category) {
        categoryName = category.name;
      }
    }

    // Formatear la respuesta
    const formattedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      saleprice: product.saleprice,
      image: product.image,
      description: product.description,
      categoryname: categoryName
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error in product API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 