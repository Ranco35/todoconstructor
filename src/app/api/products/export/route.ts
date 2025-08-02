import { NextResponse } from 'next/server';
import { generateProductsExcel } from '@/actions/products/export';

export async function GET(request: Request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    
    const excelBuffer = await generateProductsExcel({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      search: search || undefined
    });
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Nombre del archivo con información de los filtros
    let fileName = `productos_${new Date().toISOString().split('T')[0]}`;
    if (categoryId) {
      fileName += `_categoria_${categoryId}`;
    }
    if (search) {
      fileName += `_busqueda_${search.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    fileName += '.xlsx';
    
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error en export API:', error);
    return NextResponse.json(
      { error: 'Error al exportar productos' },
      { status: 500 }
    );
  }
} 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length) {
      return NextResponse.json({ error: 'No se recibieron IDs para exportar.' }, { status: 400 });
    }
    const excelBuffer = await generateProductsExcel({ ids });
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    let fileName = `productos_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`;
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error en export POST API:', error);
    return NextResponse.json(
      { error: 'Error al exportar productos seleccionados' },
      { status: 500 }
    );
  }
} 